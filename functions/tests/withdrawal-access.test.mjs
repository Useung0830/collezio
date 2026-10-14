import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

test("탈퇴 요청과 피드백 위조·열람, 오래된 인증, 탈퇴 접수 후 쓰기를 거부한다", async () => {
  assert.ok(
    process.env.FIRESTORE_EMULATOR_HOST &&
      process.env.FIREBASE_AUTH_EMULATOR_HOST,
  );
  const app = initializeApp({ projectId: "demo-collezio" }, randomUUID());
  const db = getFirestore(app),
    auth = getAuth(app);
  const signup = await fetch(
    `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key`,
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
  const { localId: userId, idToken } = await signup.json();
  assert.ok(userId && idToken);
  const endpoint =
    "http://127.0.0.1:5001/demo-collezio/asia-northeast3/withdrawAccount";
  const call = (token, data) =>
    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ data }),
    });
  const empty = { reasons: [], detail: "" };
  assert.equal((await call(null, empty)).status, 401);
  assert.equal((await call(idToken, { ...empty, uid: "victim" })).status, 400);
  // 에뮬레이터의 서명 없는 토큰만 사용해 오래된 auth_time을 재현합니다.
  const parts = idToken.split(".");
  const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString());
  claims.auth_time = Math.floor(Date.now() / 1000) - 600;
  parts[1] = Buffer.from(JSON.stringify(claims)).toString("base64url");
  assert.equal((await call(parts.join("."), empty)).status, 400);
  assert.equal(
    (await db.doc(`withdrawalRequests/${userId}`).get()).exists,
    false,
  );
  const base = `http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/demo-collezio/databases/(default)/documents`;
  const access = (path, method = "GET", fields) =>
    fetch(`${base}/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      ...(fields ? { body: JSON.stringify({ fields }) } : {}),
    });
  assert.equal(
    (
      await access(`withdrawalRequests/${userId}`, "PATCH", {
        status: { stringValue: "completed" },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await access(`withdrawalFeedback/${userId}`, "PATCH", {
        detail: { stringValue: "fake" },
      })
    ).status,
    403,
  );
  await db.doc(`withdrawalRequests/${userId}`).set({ status: "processing" });
  await db.doc(`withdrawalFeedback/${userId}`).set(empty);
  assert.equal((await access(`withdrawalRequests/${userId}`)).status, 200);
  assert.equal((await access("withdrawalRequests/another-user")).status, 403);
  assert.equal((await access(`withdrawalFeedback/${userId}`)).status, 403);
  assert.equal(
    (
      await access(`users/${userId}/chatBlocks/other`, "PATCH", {
        createdAt: { timestampValue: new Date().toISOString() },
      })
    ).status,
    403,
  );
  const upload = await fetch(
    `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}/v0/b/demo-collezio.appspot.com/o?name=products/${userId}/image`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "image/png",
      },
      body: "test",
    },
  );
  assert.equal(upload.status, 403);
  await Promise.all([
    auth.deleteUser(userId),
    db.doc(`withdrawalRequests/${userId}`).delete(),
    db.doc(`withdrawalFeedback/${userId}`).delete(),
  ]);
});
