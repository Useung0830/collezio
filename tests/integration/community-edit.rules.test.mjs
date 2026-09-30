import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

import { deleteApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDocFromServer,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  connectStorageEmulator,
  getMetadata,
  ref,
  uploadBytes,
} from "firebase/storage";

test("커뮤니티 수정·삭제 API와 권한 및 실패 복구", async (t) => {
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "demo-collezio";
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "demo-key";
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "demo-collezio.appspot.com";
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === "client-only")
        return { url: "data:text/javascript,export {};", shortCircuit: true };
      if (
        ([
          "/api/updateCommunityPost.ts",
          "/api/writeCommunityComment.ts",
          "/api/setCommunityLike.ts",
        ].some((path) => context.parentURL?.endsWith(path)) &&
          specifier === "firebase/firestore") ||
        (context.parentURL?.endsWith("/api/deleteCommunityPost.ts") &&
          specifier === "@/features/community/api/deleteCommunityImages")
      )
        return nextResolve(
          new URL("./helpers/communityEditFaults.mjs", import.meta.url).href,
          context,
        );
      if (
        context.parentURL?.endsWith("/api/updateCommunityPost.ts") &&
        specifier === "@/features/community/api/uploadCommunityImage"
      )
        return nextResolve(
          new URL("./helpers/communityUploadFaults.mjs", import.meta.url).href,
          context,
        );
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
  const {
    firebaseApp,
    firebaseAuth: auth,
    firebaseDb: db,
    firebaseStorage: storage,
  } = await import("../../src/lib/firebase.ts");
  const { createCommunityPost } =
    await import("../../src/features/community/api/createCommunityPost.ts");
  const { updateCommunityPost } =
    await import("../../src/features/community/api/updateCommunityPost.ts");
  const { deleteCommunityPost } =
    await import("../../src/features/community/api/deleteCommunityPost.ts");
  const { getCommunityPost } =
    await import("../../src/features/community/api/getCommunityPost.ts");
  const { getCommunityDeletion } =
    await import("../../src/features/community/api/getCommunityDeletion.ts");
  const { editFaults } = await import("./helpers/communityEditFaults.mjs");
  const { uploads } = await import("./helpers/communityUploadFaults.mjs");
  connectAuthEmulator(
    auth,
    `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`,
    { disableWarnings: true },
  );
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(":");
  connectFirestoreEmulator(db, host, Number(port));
  const [storageHost, storagePort] =
    process.env.FIREBASE_STORAGE_EMULATOR_HOST.split(":");
  connectStorageEmulator(storage, storageHost, Number(storagePort));
  storage.maxUploadRetryTime = 1000;
  const email = `community-edit-${crypto.randomUUID()}@example.com`;
  const password = "Test1234!";
  const file = new File(["photo"], "photo.png", { type: "image/png" });
  const denied = (error) => error.code === "permission-denied";
  const missing = (error) => error.code === "storage/object-not-found";
  const stamp = () => ({
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  try {
    const { user } = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const makePost = (files = [file]) =>
      createCommunityPost({ title: "수정 전", content: "본문", files });
    const editInput = (post) => ({
      postId: post.id,
      userId: user.uid,
      title: "수정 후",
      content: "새 본문",
      retainedPaths: post.images.map((image) => image.path),
      version: post.version,
    });
    await t.test(
      "10장 글에서 기존 사진 유지·제거·추가와 최신 버전 충돌",
      async () => {
        const postId = await makePost(Array(10).fill(file));
        const post = await getCommunityPost(postId);
        const result = await updateCommunityPost({
          ...editInput(post),
          retainedPaths: post.images.slice(1).map((image) => image.path),
          files: [file],
        });
        assert.equal(result.isCleaned, true);
        const latest = await getCommunityPost(postId);
        assert.equal(latest.title, "수정 후");
        assert.equal(latest.images.length, 10);
        assert.notEqual(latest.version, post.version);
        await assert.rejects(
          getMetadata(ref(storage, post.images[0].path)),
          missing,
        );
        assert.equal(
          (await getMetadata(ref(storage, latest.images[0].path))).size,
          file.size,
        );
        await assert.rejects(
          updateCommunityPost(editInput(post)),
          /다른 곳에서 수정/,
        );
        await deleteCommunityPost({ postId, userId: user.uid });
        assert.equal(await getCommunityPost(postId), null);
        for (const image of latest.images)
          await assert.rejects(getMetadata(ref(storage, image.path)), missing);
      },
    );
    await t.test(
      "업로드·커밋 실패와 동시 수정은 기존 사진 보존 및 새 파일 정리",
      async () => {
        const postId = await makePost();
        const post = await getCommunityPost(postId);
        for (const failure of ["upload", "before", "conflict"]) {
          uploads.paths = [];
          uploads.failAt = failure === "upload" ? 1 : 0;
          editFaults.failure = failure === "before" ? "before" : null;
          editFaults.beforeTransaction =
            failure === "conflict"
              ? () =>
                  updateDoc(doc(db, "communityPosts", postId), {
                    title: "다른 탭 수정",
                    updatedAt: serverTimestamp(),
                  })
              : null;
          await assert.rejects(
            updateCommunityPost({ ...editInput(post), files: [file] }),
          );
          for (const path of uploads.paths)
            await assert.rejects(getMetadata(ref(storage, path)), missing);
          assert.equal(
            (await getMetadata(ref(storage, post.images[0].path))).size,
            file.size,
          );
        }
        editFaults.beforeTransaction = null;
        await deleteCommunityPost({ postId, userId: user.uid });
      },
    );
    await t.test(
      "커밋 후 응답 유실은 저장 성공으로 복구하고 참조 사진 보존",
      async () => {
        const postId = await makePost();
        const post = await getCommunityPost(postId);
        editFaults.failure = "after";
        await updateCommunityPost({
          ...editInput(post),
          retainedPaths: [],
          files: [file],
        });
        editFaults.failure = null;
        const latest = await getCommunityPost(postId);
        assert.equal(latest.title, "수정 후");
        assert.equal(
          (await getMetadata(ref(storage, latest.images[0].path))).size,
          file.size,
        );
        await assert.rejects(
          getMetadata(ref(storage, post.images[0].path)),
          missing,
        );
        await deleteCommunityPost({ postId, userId: user.uid });
      },
    );
    await t.test(
      "타인 글 수정·삭제·작업기록 위조 거부 및 100개 초과 댓글·좋아요 정리 재시도",
      async () => {
        const postId = await makePost();
        const post = await getCommunityPost(postId);
        const postRef = doc(db, "communityPosts", postId);
        const jobRef = doc(db, "communityPostDeletions", postId);
        const { user: other } = await createUserWithEmailAndPassword(
          auth,
          `other-${crypto.randomUUID()}@example.com`,
          password,
        );
        await assert.rejects(
          updateCommunityPost({ ...editInput(post), userId: other.uid }),
          /본인 게시글/,
        );
        await assert.rejects(
          deleteCommunityPost({ postId, userId: other.uid }),
          /본인 게시글/,
        );
        await assert.rejects(
          updateDoc(postRef, {
            title: "공격",
            images: [],
            updatedAt: serverTimestamp(),
          }),
          denied,
        );
        const forged = writeBatch(db);
        forged.set(jobRef, {
          authorId: other.uid,
          images: [],
          createdAt: serverTimestamp(),
        });
        forged.delete(postRef);
        await assert.rejects(forged.commit(), denied);
        const batch = writeBatch(db);
        for (let index = 0; index < 105; index++)
          batch.set(doc(collection(db, "communityComments")), {
            postId,
            authorId: other.uid,
            content: "댓글",
            ...stamp(),
          });
        await batch.commit();
        // Admin REST seeds many different users' likes without creating 105 accounts.
        const baseUrl = `http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/demo-collezio/databases/(default)/documents`;
        for (let index = 0; index < 105; index++) {
          const response = await fetch(
            `${baseUrl}/communityPosts/${postId}/likes/user-${index}`,
            {
              method: "PATCH",
              headers: {
                Authorization: "Bearer owner",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                fields: {
                  createdAt: { timestampValue: new Date().toISOString() },
                },
              }),
            },
          );
          assert.equal(response.ok, true);
        }
        await signInWithEmailAndPassword(auth, email, password);
        const wrongJob = writeBatch(db);
        wrongJob.set(jobRef, {
          authorId: user.uid,
          images: [],
          createdAt: serverTimestamp(),
        });
        wrongJob.delete(postRef);
        await assert.rejects(wrongJob.commit(), denied);
        editFaults.failCleanup = true;
        await assert.rejects(
          deleteCommunityPost({ postId, userId: user.uid }),
          /삭제를 완료하지 못했습니다/,
        );
        assert.equal(await getCommunityPost(postId), null);
        assert.equal(
          (await getCommunityDeletion(postId, user.uid)).paths.length,
          1,
        );
        assert.equal(
          (
            await getDocs(
              query(
                collection(db, "communityComments"),
                where("postId", "==", postId),
              ),
            )
          ).size,
          0,
        );
        assert.equal((await getDocs(collection(postRef, "likes"))).size, 0);
        await assert.rejects(
          uploadBytes(
            ref(storage, `community/${user.uid}/${postId}/late`),
            file,
          ),
          (error) => error.code === "storage/unauthorized",
        );
        await assert.rejects(
          setDoc(postRef, {
            authorId: user.uid,
            title: "재생성",
            content: "본문",
            images: [],
            likeCount: 0,
            viewCount: 0,
            ...stamp(),
          }),
          denied,
        );
        await assert.rejects(
          setDoc(doc(collection(db, "communityComments")), {
            postId,
            authorId: user.uid,
            content: "늦은 댓글",
            ...stamp(),
          }),
          denied,
        );
        await signInWithEmailAndPassword(auth, other.email, password);
        await assert.rejects(getDocFromServer(jobRef), denied);
        await assert.rejects(deleteDoc(jobRef), denied);
        await assert.rejects(
          deleteCommunityPost({ postId, userId: other.uid }),
          /삭제를 완료하지 못했습니다/,
        );
        await signInWithEmailAndPassword(auth, email, password);
        editFaults.failCleanup = false;
        await deleteCommunityPost({ postId, userId: user.uid });
        assert.equal(await getCommunityDeletion(postId, user.uid), null);
        await assert.rejects(
          getMetadata(ref(storage, post.images[0].path)),
          missing,
        );
        await deleteCommunityPost({ postId, userId: user.uid });
      },
    );
    await t.test(
      "댓글 멱등 등록·페이지 조회·수정 충돌·5분 제한과 좋아요 중복 방지",
      async () => {
        const { writeCommunityComment } =
          await import("../../src/features/community/api/writeCommunityComment.ts");
        const { getCommunityComments } =
          await import("../../src/features/community/api/getCommunityComments.ts");
        const { setCommunityLike } =
          await import("../../src/features/community/api/setCommunityLike.ts");
        const { getCommunityLike } =
          await import("../../src/features/community/api/getCommunityLike.ts");
        const postId = await makePost([]);
        await assert.rejects(
          setCommunityLike({ postId, userId: user.uid, isLiked: true }),
          /본인 게시글/,
        );
        const ownLike = writeBatch(db);
        ownLike.set(doc(db, "communityPosts", postId, "likes", user.uid), {
          createdAt: serverTimestamp(),
        });
        ownLike.update(doc(db, "communityPosts", postId), { likeCount: 1 });
        await assert.rejects(ownLike.commit(), denied);
        const { user: reader } = await createUserWithEmailAndPassword(
          auth,
          `reader-${crypto.randomUUID()}@example.com`,
          password,
        );
        await assert.doesNotReject(
          () =>
            Promise.all(
              Array.from({ length: 3 }, () =>
                setCommunityLike({ postId, userId: reader.uid, isLiked: true }),
              ),
            ),
          "동시에 같은 좋아요 등록",
        );
        assert.equal(await getCommunityLike(postId, reader.uid), true);
        assert.equal((await getCommunityPost(postId)).likeCount, 1);
        await Promise.all(
          Array.from({ length: 3 }, () =>
            setCommunityLike({ postId, userId: reader.uid, isLiked: false }),
          ),
        );
        assert.equal((await getCommunityPost(postId)).likeCount, 0);
        editFaults.failure = "before";
        await assert.rejects(
          setCommunityLike({ postId, userId: reader.uid, isLiked: true }),
        );
        assert.equal((await getCommunityPost(postId)).likeCount, 0);
        editFaults.failure = "after";
        await setCommunityLike({ postId, userId: reader.uid, isLiked: true });
        assert.equal((await getCommunityPost(postId)).likeCount, 1);
        await setCommunityLike({ postId, userId: reader.uid, isLiked: false });
        assert.equal((await getCommunityPost(postId)).likeCount, 0);
        editFaults.failure = null;
        const commentId = crypto.randomUUID();
        const input = {
          action: "create",
          commentId,
          postId,
          userId: reader.uid,
          content: "첫 댓글",
        };
        await assert.rejects(
          writeCommunityComment({ ...input, content: " " }),
          /1~1,000자/,
        );
        await Promise.all([
          writeCommunityComment(input),
          writeCommunityComment(input),
        ]);
        assert.equal((await getCommunityComments(postId)).comments.length, 1);
        editFaults.failure = "after";
        const recoveredInput = {
          ...input,
          commentId: crypto.randomUUID(),
          content: "응답 유실 댓글",
        };
        await writeCommunityComment(recoveredInput);
        await writeCommunityComment(recoveredInput);
        editFaults.failure = null;
        await writeCommunityComment({ ...recoveredInput, action: "delete" });
        const original = (await getCommunityComments(postId)).comments[0];
        await writeCommunityComment({
          ...input,
          action: "update",
          content: "수정 댓글",
          version: original.version,
        });
        await assert.rejects(
          writeCommunityComment({
            ...input,
            action: "update",
            content: "오래된 수정",
            version: original.version,
          }),
          /다른 곳에서 수정/,
        );
        const url = `http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/demo-collezio/databases/(default)/documents/communityComments/${commentId}?updateMask.fieldPaths=createdAt`;
        const old = await fetch(url, {
          method: "PATCH",
          headers: {
            Authorization: "Bearer owner",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fields: {
              createdAt: {
                timestampValue: new Date(Date.now() - 301000).toISOString(),
              },
            },
          }),
        });
        assert.equal(old.ok, true);
        const latest = (await getCommunityComments(postId)).comments[0];
        await assert.rejects(
          writeCommunityComment({
            ...input,
            action: "update",
            content: "기간 만료",
            version: latest.version,
          }),
          /5분/,
        );
        await assert.rejects(
          updateDoc(doc(db, "communityComments", commentId), {
            content: "직접 수정",
            updatedAt: serverTimestamp(),
          }),
          denied,
        );
        for (let index = 0; index < 21; index++)
          await writeCommunityComment({
            ...input,
            commentId: crypto.randomUUID(),
            content: `댓글 ${index}`,
          });
        const first = await getCommunityComments(postId);
        const second = await getCommunityComments(postId, first.nextCursor);
        assert.equal(first.comments.length, 20);
        assert.equal(second.comments.length, 2);
        assert.equal(
          new Set(
            [...first.comments, ...second.comments].map(
              (comment) => comment.id,
            ),
          ).size,
          22,
        );
        await signInWithEmailAndPassword(auth, email, password);
        await assert.rejects(
          writeCommunityComment({
            ...input,
            action: "delete",
            userId: user.uid,
          }),
          /본인 댓글/,
        );
        await signInWithEmailAndPassword(auth, reader.email, password);
        await writeCommunityComment({ ...input, action: "delete" });
        await writeCommunityComment({ ...input, action: "delete" });
        await signInWithEmailAndPassword(auth, email, password);
        await deleteCommunityPost({ postId, userId: user.uid });
        await assert.rejects(
          writeCommunityComment({
            ...input,
            userId: user.uid,
            commentId: crypto.randomUUID(),
          }),
          /삭제된 게시글/,
        );
      },
    );
  } finally {
    await deleteApp(firebaseApp);
    hooks.deregister();
  }
});
