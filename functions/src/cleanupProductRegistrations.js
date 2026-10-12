import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { error as logError } from "firebase-functions/logger";
import { HttpsError } from "firebase-functions/v2/https";

import {
  assertKeys,
  assertRegistrationUser,
  CLEANUP_GRACE_MS,
  later,
  ownedRegistration,
  parseRegistrationId,
} from "./productRegistrationData.js";

export async function cleanProductRegistration(
  { db, bucket },
  id,
  userId = null,
) {
  const ref = db.doc("productRegistrations/" + id);
  const data = await db.runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists) return null;
    const data = userId ? ownedRegistration(snapshot, userId) : snapshot.data();
    if (data.status === "committed") {
      if (userId)
        throw new HttpsError(
          "failed-precondition",
          "이미 등록된 상품입니다. 등록 결과를 확인해주세요.",
        );
      return null;
    }
    if (!userId && data.cleanupAt?.toMillis() > Date.now()) return null;
    if ((await tx.get(db.doc("products/" + id))).exists)
      throw new Error("Unexpected product for uncommitted registration");
    const cleanupAfter = data.cleanupAfter ?? later(CLEANUP_GRACE_MS);
    tx.update(ref, {
      status: "cleaning",
      cleanupAfter,
      cleanupAt: later(CLEANUP_GRACE_MS),
    });
    return { ...data, cleanupAfter };
  });
  if (!data) return;
  // Paths were recorded before any upload, including writes with lost responses.
  const results = await Promise.allSettled(
    data.files.map((file) =>
      bucket.file(file.path).delete({ ignoreNotFound: true }),
    ),
  );
  if (results.some((result) => result.status === "rejected"))
    throw new Error("Product image cleanup will retry");
  // Keep a tombstone and repeat after all 120-second upload invocations have expired.
  await ref.update(
    Date.now() >= data.cleanupAfter.toMillis()
      ? {
          status: "cleaned",
          cleanedAt: FieldValue.serverTimestamp(),
          cleanupAt: FieldValue.delete(),
          product: null,
        }
      : { cleanupAt: data.cleanupAfter },
  );
}

export async function cancelProductRegistration(services, userId, input) {
  await assertRegistrationUser(services, userId);
  assertKeys(input, ["registrationId"]);
  const id = parseRegistrationId(input.registrationId);
  // A failed deletion stays queued. Never report cancellation for a committed product.
  try {
    await cleanProductRegistration(services, id, userId);
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logError("Product registration cleanup deferred", { registrationId: id });
    const snapshot = await services.db.doc("productRegistrations/" + id).get();
    if (!snapshot.exists || snapshot.get("status") !== "cleaning") throw error;
  }
  return { status: "cleaning" };
}

export async function cleanExpiredProductRegistrations(services) {
  const snapshot = await services.db
    .collection("productRegistrations")
    .where("cleanupAt", "<=", Timestamp.now())
    .orderBy("cleanupAt")
    .limit(50)
    .get();
  for (const document of snapshot.docs) {
    try {
      await cleanProductRegistration(services, document.id);
    } catch {
      logError("Product registration cleanup will retry", {
        registrationId: document.id,
      });
    }
  }
}
