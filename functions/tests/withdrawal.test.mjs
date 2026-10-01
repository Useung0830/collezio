import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

import { parseWithdrawalFeedback } from "../src/parseWithdrawalFeedback.js";
import { processWithdrawal } from "../src/processWithdrawal.js";

test("피드백은 선택사항이며 코드·길이·중복·추가 필드를 검증한다", () => {
  assert.deepEqual(parseWithdrawalFeedback({ reasons: [], detail: "  " }), {
    reasons: [],
    detail: "",
  });
  for (const input of [
    null,
    {},
    { reasons: ["invalid"], detail: "" },
    { reasons: ["trust", "trust"], detail: "" },
    { reasons: [], detail: "x".repeat(201) },
    { reasons: [], detail: "", uid: "other" },
  ])
    assert.throws(() => parseWithdrawalFeedback(input));
});

test("부분 실패 후 재시도는 집계를 중복 차감하지 않고 계정과 데이터를 정리한다", async () => {
  assert.ok(
    process.env.FIRESTORE_EMULATOR_HOST &&
      process.env.FIREBASE_AUTH_EMULATOR_HOST &&
      process.env.FIREBASE_STORAGE_EMULATOR_HOST,
  );
  const app = initializeApp(
    { projectId: "demo-collezio", storageBucket: "demo-collezio.appspot.com" },
    randomUUID(),
  );
  const db = getFirestore(app),
    auth = getAuth(app),
    bucket = getStorage(app).bucket();
  const user = await auth.createUser({
    email: `${randomUUID()}@example.com`,
    password: "Test1234!",
  });
  const id = user.uid,
    suffix = randomUUID();
  const ownProduct = db.doc(`products/own-${suffix}`),
    otherProduct = db.doc(`products/other-${suffix}`);
  const ownPost = db.doc(`communityPosts/own-${suffix}`),
    otherPost = db.doc(`communityPosts/other-${suffix}`);
  const room = db.doc(`chatRooms/${suffix}`),
    request = db.doc(`withdrawalRequests/${id}`);
  const feedbackId = randomUUID();
  const batch = db.batch();
  batch.set(ownProduct, { sellerId: id, favoriteCount: 0 });
  batch.set(otherProduct, { sellerId: "other", favoriteCount: 2 });
  batch.set(db.doc(`users/${id}/favorites/${otherProduct.id}`), {
    createdAt: Timestamp.now(),
  });
  batch.set(ownPost, { authorId: id });
  batch.set(ownPost.collection("likes").doc("other"), {});
  batch.set(otherPost, { authorId: "other", likeCount: 2 });
  batch.set(otherPost.collection("likes").doc(id), {});
  batch.set(db.doc(`communityComments/own-${suffix}`), {
    authorId: id,
    postId: otherPost.id,
  });
  batch.set(db.doc(`communityComments/related-${suffix}`), {
    authorId: "other",
    postId: ownPost.id,
  });
  batch.set(db.doc(`profiles/${id}`), { nickname: "삭제할 닉네임" });
  batch.set(room, {
    requesterId: "other",
    sellerId: id,
    status: "active",
    visibleTo: ["other", id],
  });
  batch.set(room.collection("messages").doc("message"), {
    senderId: id,
    content: "보존할 대화",
  });
  batch.set(request, {
    status: "processing",
    feedback: { reasons: ["trust"], detail: "개선해주세요" },
    feedbackId,
    createdAt: Timestamp.now(),
  });
  await batch.commit();
  await bucket.file(`products/${id}/image`).save("test");
  const services = { db, auth, bucket };
  await assert.rejects(
    processWithdrawal(
      {
        ...services,
        bucket: {
          getFiles: async () => {
            throw new Error("storage unavailable");
          },
        },
      },
      id,
    ),
  );
  assert.equal((await request.get()).get("status"), "processing");
  assert.equal((await auth.getUser(id)).disabled, true);
  assert.equal((await otherProduct.get()).get("favoriteCount"), 1);
  assert.equal((await otherPost.get()).get("likeCount"), 1);
  assert.equal(await processWithdrawal(services, id), "completed");
  assert.equal(await processWithdrawal(services, id), "completed");
  await assert.rejects(auth.getUser(id), { code: "auth/user-not-found" });
  assert.equal((await ownProduct.get()).exists, false);
  assert.equal((await ownPost.get()).exists, false);
  assert.equal((await db.doc(`profiles/${id}`).get()).exists, false);
  assert.equal(
    (await db.doc(`communityComments/related-${suffix}`).get()).exists,
    false,
  );
  assert.equal(
    (await db.doc(`communityComments/own-${suffix}`).get()).exists,
    false,
  );
  assert.equal((await bucket.file(`products/${id}/image`).exists())[0], false);
  assert.equal(
    (await room.collection("messages").doc("message").get()).get("content"),
    "보존할 대화",
  );
  assert.deepEqual((await room.get()).get("withdrawnUserIds"), [id]);
  const feedback = (
    await db.doc(`withdrawalFeedback/${feedbackId}`).get()
  ).data();
  assert.deepEqual(Object.keys(feedback).sort(), [
    "createdAt",
    "detail",
    "reasons",
  ]);
  assert.equal((await request.get()).get("feedback"), undefined);
  assert.equal((await otherProduct.get()).get("favoriteCount"), 1);
  assert.equal((await otherPost.get()).get("likeCount"), 1);
  await db.recursiveDelete(room);
  await Promise.all([
    request.delete(),
    otherProduct.delete(),
    otherPost.delete(),
    db.doc(`withdrawalFeedback/${feedbackId}`).delete(),
  ]);
});
