import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

import { deleteApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  connectFirestoreEmulator,
  doc,
  getDocFromServer,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { connectFunctionsEmulator } from "firebase/functions";
import {
  connectStorageEmulator,
  deleteObject,
  getMetadata,
  ref,
  uploadBytes,
} from "firebase/storage";

test("프로필 수정 API와 사진 소유권·집계 보호", async () => {
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
      if (specifier.startsWith("@/"))
        return nextResolve(
          new URL(`../../src/${specifier.slice(2)}.ts`, import.meta.url).href,
          context,
        );
      return nextResolve(specifier, context);
    },
  });
  const {
    firebaseApp,
    firebaseAuth,
    firebaseDb,
    firebaseStorage,
    firebaseFunctions,
  } = await import("../../src/lib/firebase.ts");
  const { updatePublicProfile } =
    await import("../../src/features/user/api/updatePublicProfile.ts");
  const { createPublicProfile } =
    await import("../../src/features/user/api/createPublicProfile.ts");
  connectFunctionsEmulator(firebaseFunctions, "127.0.0.1", 5001);
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
  const denied = (error) =>
    ["permission-denied", "storage/unauthorized"].includes(error.code);
  try {
    const { user } = await createUserWithEmailAndPassword(
      firebaseAuth,
      `profile-edit-${Date.now()}@example.com`,
      "Test1234!",
    );
    const own = doc(firebaseDb, "profiles", user.uid);
    await updateProfile(user, { displayName: "기존닉네임" });
    await createPublicProfile(user.uid);
    const input = { userId: user.uid, nickname: " 새닉네임 ", image: null };
    assert.equal((await updatePublicProfile(input)).nickname, "새닉네임");
    assert.equal((await getDocFromServer(own)).data().nickname, "새닉네임");
    for (const nickname of [" ", "가", "가".repeat(11)]) {
      await assert.rejects(updatePublicProfile({ ...input, nickname }));
      await assert.rejects(updateDoc(own, { nickname }), denied);
    }
    for (const changes of [
      { rating: 5 },
      { tradeCount: 100 },
      { bio: "변경" },
      { createdAt: serverTimestamp() },
      { email: "private" },
    ]) {
      await assert.rejects(updateDoc(own, changes), denied);
    }
    const file = new File(["test-image"], "profile.png", { type: "image/png" });
    const imageInput = { ...input, image: file };
    const result = await updatePublicProfile(imageInput);
    assert.ok(result.imageUrl.includes("firebasestorage.googleapis.com"));
    const firstPath = (await getDocFromServer(own)).data().imagePath;
    assert.equal(
      (await getMetadata(ref(firebaseStorage, firstPath))).size,
      file.size,
    );
    await assert.rejects(deleteObject(ref(firebaseStorage, firstPath)), denied);
    await assert.rejects(
      uploadBytes(ref(firebaseStorage, firstPath), file),
      denied,
    );
    await updatePublicProfile({ ...input, nickname: "사진유지" });
    assert.equal((await getDocFromServer(own)).data().imagePath, firstPath);
    await updatePublicProfile(imageInput);
    await assert.rejects(getMetadata(ref(firebaseStorage, firstPath)), {
      code: "storage/object-not-found",
    });
    const current = (await getDocFromServer(own)).data();
    await assert.rejects(
      updateDoc(own, { imageUrl: "https://example.com/photo" }),
      denied,
    );
    await assert.rejects(
      updateDoc(own, {
        imagePath: "profiles/other/photo",
        imageUrl: current.imageUrl,
      }),
      denied,
    );
    for (const invalid of [
      new File([], "empty.png", { type: "image/png" }),
      new File(["svg"], "photo.svg", { type: "image/svg+xml" }),
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", {
        type: "image/png",
      }),
    ]) {
      await assert.rejects(updatePublicProfile({ ...input, image: invalid }));
      await assert.rejects(
        uploadBytes(
          ref(firebaseStorage, `profiles/${user.uid}/invalid`),
          invalid,
        ),
        denied,
      );
    }
    await assert.rejects(
      uploadBytes(ref(firebaseStorage, "profiles/other/photo"), file),
      denied,
    );
    await createUserWithEmailAndPassword(
      firebaseAuth,
      `profile-other-${Date.now()}@example.com`,
      "Test1234!",
    );
    await assert.rejects(updatePublicProfile(input), /로그인 상태/);
    await assert.rejects(updateDoc(own, { nickname: "타인수정" }), denied);
    await signOut(firebaseAuth);
    await assert.rejects(updateDoc(own, { nickname: "익명수정" }), denied);
    await assert.rejects(
      uploadBytes(ref(firebaseStorage, `profiles/${user.uid}/anonymous`), file),
      denied,
    );
    assert.equal((await getDocFromServer(own)).data().nickname, "새닉네임");
  } finally {
    await deleteApp(firebaseApp);
    hooks.deregister();
  }
});
