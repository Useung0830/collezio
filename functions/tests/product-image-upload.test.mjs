import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { deleteApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import sharp from "sharp";

const bucketName = "demo-collezio.appspot.com";

test("상품 업로드는 인증·압축·메타데이터 기록을 거치고 원본 직접 저장을 거부한다", async () => {
  assert.equal(process.env.GCLOUD_PROJECT, "demo-collezio");
  assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, "127.0.0.1:9099");
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080");
  assert.equal(process.env.FIREBASE_STORAGE_EMULATOR_HOST, "127.0.0.1:9199");
  const app = initializeApp(
    { projectId: "demo-collezio", storageBucket: bucketName },
    randomUUID(),
  );
  const auth = getAuth(app);
  const db = getFirestore(app);
  const bucket = getStorage(app).bucket();
  const signup = await fetch(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `${randomUUID()}@example.com`,
        password: "Test1234!",
        returnSecureToken: true,
      }),
    },
  );
  assert.equal(signup.status, 200);
  const { localId: userId, idToken } = await signup.json();
  const input = await readFile(
    new URL(
      "../../src/assets/images/product-luffy-cutout.png",
      import.meta.url,
    ),
  );
  const payload = {
    base64: input.toString("base64"),
    contentType: "image/png",
  };
  const call = (data, token = idToken) =>
    fetch(
      "http://127.0.0.1:5001/demo-collezio/asia-northeast3/uploadProductImage",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ data }),
      },
    );
  try {
    assert.equal((await call(payload, null)).status, 401);
    for (const data of [
      { ...payload, userId: "another-user" },
      { ...payload, contentType: "image/jpeg" },
      { ...payload, base64: "invalid!" },
      { ...payload, base64: Buffer.from("not an image").toString("base64") },
    ])
      assert.equal((await call(data)).status, 400);
    assert.equal(
      (await bucket.getFiles({ prefix: `products/${userId}/` }))[0].length,
      0,
    );

    const response = await call(payload);
    assert.equal(response.status, 200, await response.clone().text());
    const { result } = await response.json();
    assert.ok(result.path.startsWith(`products/${userId}/`));
    const url = new URL(result.url);
    assert.equal(url.origin, "https://firebasestorage.googleapis.com");
    assert.equal(
      url.pathname,
      `/v0/b/${bucketName}/o/${encodeURIComponent(result.path)}`,
    );
    const file = bucket.file(result.path);
    const [stored] = await file.download();
    const [metadata] = await file.getMetadata();
    const decoded = await sharp(stored).metadata();
    assert.equal(decoded.width, 1254);
    assert.equal(decoded.height, 1254);
    assert.equal(decoded.format, "webp");
    assert.ok(stored.length < input.length);
    assert.equal(metadata.contentType, "image/webp");
    assert.equal(metadata.metadata.width, "1254");
    assert.equal(metadata.metadata.height, "1254");
    assert.equal(metadata.metadata.originalBytes, String(input.length));
    assert.equal(metadata.metadata.bytes, String(stored.length));
    assert.equal(
      metadata.metadata.firebaseStorageDownloadTokens,
      url.searchParams.get("token"),
    );

    const directUpload = await fetch(
      `http://127.0.0.1:9199/v0/b/${bucketName}/o?name=${encodeURIComponent(`products/${userId}/${randomUUID()}`)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "image/png",
        },
        body: input,
      },
    );
    assert.equal(directUpload.status, 403);
    await db.doc(`withdrawalRequests/${userId}`).set({ status: "processing" });
    assert.equal((await call(payload)).status, 403);
    assert.equal(
      (await bucket.getFiles({ prefix: `products/${userId}/` }))[0].length,
      1,
    );
  } finally {
    await bucket.deleteFiles({ prefix: `products/${userId}/` });
    await db.doc(`withdrawalRequests/${userId}`).delete();
    await auth.deleteUser(userId);
    await deleteApp(app);
  }
});
