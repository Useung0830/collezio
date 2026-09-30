import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

import { deleteApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getDocFromServer,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  connectStorageEmulator,
  deleteObject,
  getDownloadURL,
  getMetadata,
  ref,
  uploadBytes,
} from "firebase/storage";

test("커뮤니티 사진 API·Storage·Firestore 규칙", async (t) => {
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
  assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST);
  assert.ok(process.env.FIREBASE_STORAGE_EMULATOR_HOST);
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "demo-collezio";
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "demo-key";
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "demo-collezio.appspot.com";
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === "client-only")
        return { url: "data:text/javascript,export {};", shortCircuit: true };
      if (context.parentURL?.endsWith("/api/createCommunityPost.ts")) {
        if (specifier === "firebase/firestore")
          return nextResolve(
            new URL("./helpers/communityFirestoreFaults.mjs", import.meta.url)
              .href,
            context,
          );
        if (specifier === "@/features/community/api/uploadCommunityImage")
          return nextResolve(
            new URL("./helpers/communityUploadFaults.mjs", import.meta.url)
              .href,
            context,
          );
      }
      if (specifier.startsWith("@/"))
        return nextResolve(
          new URL(`../../src/${specifier.slice(2)}.ts`, import.meta.url).href,
          context,
        );
      if (specifier === "./parseCommunityImages")
        return nextResolve(
          new URL(
            "../../src/features/community/utils/parseCommunityImages.ts",
            import.meta.url,
          ).href,
          context,
        );
      return nextResolve(specifier, context);
    },
  });
  const { firebaseApp, firebaseAuth, firebaseDb, firebaseStorage } =
    await import("../../src/lib/firebase.ts");
  const { createCommunityPost } =
    await import("../../src/features/community/api/createCommunityPost.ts");
  const { getCommunityPost } =
    await import("../../src/features/community/api/getCommunityPost.ts");
  const { uploads } = await import("./helpers/communityUploadFaults.mjs");
  const { saves } = await import("./helpers/communityFirestoreFaults.mjs");
  connectAuthEmulator(
    firebaseAuth,
    `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`,
    { disableWarnings: true },
  );
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(":");
  connectFirestoreEmulator(firebaseDb, host, Number(port));
  const [storageHost, storagePort] =
    process.env.FIREBASE_STORAGE_EMULATOR_HOST.split(":");
  connectStorageEmulator(firebaseStorage, storageHost, Number(storagePort));
  firebaseStorage.maxUploadRetryTime = 1000;
  const denied = (error) => error.code === "storage/unauthorized";
  const missing = (error) => error.code === "storage/object-not-found";
  const file = new File(["test-image"], "photo.png", { type: "image/png" });
  const input = { title: "사진 테스트", content: "본문", files: [file] };
  try {
    const { user } = await createUserWithEmailAndPassword(
      firebaseAuth,
      `community-image-${Date.now()}@example.com`,
      "Test1234!",
    );
    await t.test(
      "텍스트 글과 10장 사진 글 저장·조회, 게시 사진 변경·삭제 차단",
      async () => {
        const textId = await createCommunityPost({
          title: "텍스트",
          content: "본문",
        });
        assert.deepEqual((await getCommunityPost(textId)).images, []);
        const postId = await createCommunityPost({
          ...input,
          files: Array(10).fill(file),
        });
        const post = await getCommunityPost(postId);
        assert.equal(post.images.length, 10);
        for (const image of post.images) {
          assert.ok(image.path.startsWith(`community/${user.uid}/${postId}/`));
          assert.equal(
            (await getMetadata(ref(firebaseStorage, image.path))).size,
            file.size,
          );
        }
        await assert.rejects(
          deleteObject(ref(firebaseStorage, post.images[0].path)),
          denied,
        );
        await assert.rejects(
          uploadBytes(ref(firebaseStorage, post.images[0].path), file),
          denied,
        );
      },
    );
    await t.test(
      "업로드 및 URL 응답 실패 시 이번 시도의 파일을 모두 정리",
      async () => {
        uploads.paths = [];
        uploads.failAt = 2;
        await assert.rejects(
          createCommunityPost({ ...input, files: [file, file] }),
          /게시글을 저장하지 못했습니다/,
        );
        assert.equal(uploads.paths.length, 2);
        for (const path of uploads.paths)
          await assert.rejects(
            getMetadata(ref(firebaseStorage, path)),
            missing,
          );
        assert.equal(
          (
            await getDocFromServer(
              doc(firebaseDb, "communityPosts", uploads.paths[0].split("/")[2]),
            )
          ).exists(),
          false,
        );
        uploads.failAt = 0;
      },
    );
    await t.test(
      "게시글 저장 실패 시 정리, 저장 응답만 유실되면 게시 사진 보존",
      async () => {
        uploads.paths = [];
        saves.failure = "before";
        await assert.rejects(
          createCommunityPost(input),
          /게시글을 저장하지 못했습니다/,
        );
        for (const path of uploads.paths)
          await assert.rejects(
            getMetadata(ref(firebaseStorage, path)),
            missing,
          );
        saves.failure = "after";
        const postId = await createCommunityPost(input);
        const post = await getCommunityPost(postId);
        assert.equal(
          (await getMetadata(ref(firebaseStorage, post.images[0].path))).size,
          file.size,
        );
        saves.failure = null;
      },
    );
    await t.test(
      "타인 경로·SVG·빈 파일·용량 초과를 Storage에서도 차단",
      async () => {
        const path = `community/${user.uid}/unpublished/${crypto.randomUUID()}`;
        await assert.rejects(
          uploadBytes(ref(firebaseStorage, "community/other/post/image"), file),
          denied,
        );
        for (const invalid of [
          new File(["svg"], "image.svg", { type: "image/svg+xml" }),
          new File([], "empty.png", { type: "image/png" }),
          new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", {
            type: "image/png",
          }),
        ]) {
          await assert.rejects(
            uploadBytes(ref(firebaseStorage, path), invalid),
            denied,
          );
        }
        await uploadBytes(ref(firebaseStorage, path), file);
        const url = await getDownloadURL(ref(firebaseStorage, path));
        assert.ok(url.includes("127.0.0.1:9199"));
        await deleteObject(ref(firebaseStorage, path));
      },
    );
    await t.test(
      "Firestore에서 다른 게시글·작성자 경로, URL 불일치, 11장 차단",
      async () => {
        const reference = doc(collection(firebaseDb, "communityPosts"));
        const path = `community/${user.uid}/${reference.id}/image`;
        const image = {
          path,
          url: `https://firebasestorage.googleapis.com/v0/b/demo-collezio.appspot.com/o/${encodeURIComponent(path)}?alt=media`,
        };
        const data = {
          title: "제목",
          content: "본문",
          authorId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          likeCount: 0,
          viewCount: 0,
        };
        for (const images of [
          [{ ...image, path: "community/other/post/image" }],
          [{ ...image, path: `community/${user.uid}/other/image` }],
          [{ ...image, url: image.url.replace("%2Fimage", "%2Fother") }],
          Array(11).fill(image),
        ]) {
          await assert.rejects(
            setDoc(reference, { ...data, images }),
            (error) => error.code === "permission-denied",
          );
        }
      },
    );
    await t.test(
      "통합된 상품 이미지 규칙도 본인 업로드·삭제를 유지한다",
      async () => {
        const own = ref(
          firebaseStorage,
          `products/${user.uid}/${crypto.randomUUID()}`,
        );
        await uploadBytes(own, file);
        assert.equal((await getMetadata(own)).size, file.size);
        await assert.rejects(
          uploadBytes(ref(firebaseStorage, "products/other/image"), file),
          denied,
        );
        await deleteObject(own);
      },
    );
    await t.test("비로그인 업로드 차단", async () => {
      await signOut(firebaseAuth);
      await assert.rejects(
        uploadBytes(
          ref(firebaseStorage, `community/${user.uid}/post/image`),
          file,
        ),
        denied,
      );
      await assert.rejects(createCommunityPost(input), /로그인 후/);
    });
  } finally {
    await deleteApp(firebaseApp);
    hooks.deregister();
  }
});
