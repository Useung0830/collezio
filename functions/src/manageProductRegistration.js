import { randomUUID } from "node:crypto";

import { FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

import {
  assertKeys,
  assertNotWithdrawing,
  assertPending,
  assertRegistrationUser,
  hashBuffer,
  later,
  ownedRegistration,
  parseProductFields,
  parseRegistrationFiles,
  parseRegistrationId,
  REGISTRATION_TTL_MS,
  registrationView,
} from "./productRegistrationData.js";

export async function beginProductRegistration(services, userId, input) {
  await assertRegistrationUser(services, userId);
  assertKeys(input, ["registrationId", "product", "files"]);
  const id = parseRegistrationId(input.registrationId);
  const product = parseProductFields(input.product);
  const files = parseRegistrationFiles(input.files, userId, id);
  const fingerprint = hashBuffer(
    Buffer.from(JSON.stringify({ product, files })),
  );
  const { db } = services;
  const ref = db.doc("productRegistrations/" + id);
  const ownerRef = db.doc("productRegistrationOwners/" + userId);
  return db.runTransaction(async (tx) => {
    await assertNotWithdrawing(tx, db, userId);
    const existing = await tx.get(ref);
    if (existing.exists) {
      const data = ownedRegistration(existing, userId);
      if (data.fingerprint !== fingerprint)
        throw new HttpsError(
          "already-exists",
          "다른 내용으로 시작된 등록 작업입니다.",
        );
      return registrationView(id, data);
    }
    const owner = await tx.get(ownerRef);
    const previousId = owner.get("registrationId");
    if (previousId) {
      const previous = await tx.get(
        db.doc("productRegistrations/" + previousId),
      );
      if (
        previous.exists &&
        previous.get("status") === "pending" &&
        previous.get("expiresAt").toMillis() > Date.now()
      )
        throw new HttpsError(
          "already-exists",
          "진행 중인 등록 작업을 먼저 확인해주세요.",
        );
    }
    // Creation time also bounds recovery; reads alone never keep abandoned work alive.
    const expiresAt = later(REGISTRATION_TTL_MS);
    const data = {
      userId,
      status: "pending",
      fingerprint,
      product,
      files: files.map((file) => ({ ...file, token: randomUUID() })),
      createdAt: FieldValue.serverTimestamp(),
      expiresAt,
      cleanupAt: expiresAt,
    };
    tx.create(ref, data);
    tx.set(ownerRef, { registrationId: id });
    return registrationView(id, data);
  });
}

export async function getProductRegistration(services, userId, input) {
  await assertRegistrationUser(services, userId);
  assertKeys(input, ["registrationId"]);
  let id = input.registrationId;
  if (id === null)
    id = (
      await services.db.doc("productRegistrationOwners/" + userId).get()
    ).get("registrationId");
  if (!id) return null;
  parseRegistrationId(id);
  return services.db.runTransaction(async (tx) => {
    await assertNotWithdrawing(tx, services.db, userId);
    const snapshot = await tx.get(
      services.db.doc("productRegistrations/" + id),
    );
    if (!snapshot.exists) return null;
    const data = ownedRegistration(snapshot, userId);
    if (
      input.registrationId === null &&
      !["pending", "committed"].includes(data.status)
    )
      return null;
    return registrationView(id, data);
  });
}

export async function completeProductRegistration(services, userId, input) {
  await assertRegistrationUser(services, userId);
  assertKeys(input, ["registrationId"]);
  const id = parseRegistrationId(input.registrationId);
  const { db } = services;
  return db.runTransaction(async (tx) => {
    await assertNotWithdrawing(tx, db, userId);
    const ref = db.doc("productRegistrations/" + id);
    const data = ownedRegistration(await tx.get(ref), userId);
    const productRef = db.doc("products/" + id);
    const product = await tx.get(productRef);
    if (data.status === "committed") {
      if (!product.exists || product.get("sellerId") !== userId)
        throw new HttpsError(
          "failed-precondition",
          "등록된 상품을 확인할 수 없습니다.",
        );
      return { productId: id };
    }
    assertPending(data);
    if (product.exists || data.files.some((file) => file.status !== "ready"))
      throw new HttpsError(
        "failed-precondition",
        "사진 업로드 완료 후 등록해주세요.",
      );
    if (!(await tx.get(db.doc("profiles/" + userId))).exists)
      throw new HttpsError(
        "failed-precondition",
        "프로필을 확인한 뒤 다시 등록해주세요.",
      );
    tx.create(productRef, {
      ...parseProductFields(data.product),
      images: data.files.map((file) => file.image),
      sellerId: userId,
      status: "available",
      favoriteCount: 0,
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.update(ref, {
      status: "committed",
      completedAt: FieldValue.serverTimestamp(),
      cleanupAt: FieldValue.delete(),
    });
    return { productId: id };
  });
}

export async function acknowledgeProductRegistration(services, userId, input) {
  await assertRegistrationUser(services, userId);
  assertKeys(input, ["registrationId"]);
  const id = parseRegistrationId(input.registrationId);
  await services.db.runTransaction(async (tx) => {
    const data = ownedRegistration(
      await tx.get(services.db.doc("productRegistrations/" + id)),
      userId,
    );
    if (data.status !== "committed")
      throw new HttpsError("failed-precondition", "등록 완료 후 확인해주세요.");
    const ownerRef = services.db.doc("productRegistrationOwners/" + userId);
    const owner = await tx.get(ownerRef);
    if (owner.get("registrationId") === id) tx.delete(ownerRef);
  });
  return { acknowledged: true };
}
