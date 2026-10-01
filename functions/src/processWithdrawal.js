import { randomUUID } from "node:crypto";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { processDataPage } from "./withdrawalData.js";

const stages = [
  "favorites",
  "likes",
  "posts",
  "postDeletions",
  "comments",
  "products",
  "sellerChats",
  "requesterChats",
  "productImages",
  "communityImages",
  "profile",
  "user",
];
const LEASE_MS = 600_000;
const WORK_MS = 360_000;

export async function processWithdrawal({ db, auth, bucket }, userId) {
  const reference = db.doc(`withdrawalRequests/${userId}`);
  const leaseId = randomUUID();
  const acquired = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists || snapshot.get("status") === "completed")
      return false;
    if (snapshot.get("leaseUntil")?.toMillis() > Date.now()) return false;
    transaction.update(reference, {
      leaseId,
      leaseUntil: Timestamp.fromMillis(Date.now() + LEASE_MS),
    });
    return true;
  });
  if (!acquired) return (await reference.get()).get("status");
  const deadline = Date.now() + WORK_MS;
  try {
    try {
      await auth.updateUser(userId, { disabled: true });
      await auth.revokeRefreshTokens(userId);
    } catch (error) {
      if (error.code !== "auth/user-not-found") throw error;
    }
    let { stage = 0, cursor = "" } = (await reference.get()).data();
    while (stage < stages.length && Date.now() < deadline) {
      const next = await processDataPage(
        db,
        bucket,
        userId,
        stages[stage],
        cursor,
      );
      if (next === null) {
        stage += 1;
        cursor = "";
      } else cursor = next;
      await reference.update({ stage, cursor });
    }
    if (stage < stages.length) return "processing";
    try {
      await auth.deleteUser(userId);
    } catch (error) {
      if (error.code !== "auth/user-not-found") throw error;
    }
    await db.runTransaction(async (transaction) => {
      const request = await transaction.get(reference);
      const feedback = request.get("feedback");
      if (feedback)
        transaction.set(
          db.doc(`withdrawalFeedback/${request.get("feedbackId")}`),
          {
            ...feedback,
            createdAt: FieldValue.serverTimestamp(),
          },
        );
      transaction.update(reference, {
        status: "completed",
        completedAt: FieldValue.serverTimestamp(),
        feedback: FieldValue.delete(),
        feedbackId: FieldValue.delete(),
        leaseId: FieldValue.delete(),
        leaseUntil: FieldValue.delete(),
      });
    });
    return "completed";
  } finally {
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (snapshot.get("leaseId") === leaseId)
        transaction.update(reference, {
          leaseId: FieldValue.delete(),
          leaseUntil: FieldValue.delete(),
        });
    });
  }
}
