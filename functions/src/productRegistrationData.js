import { createHash } from "node:crypto";

import { Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

export const REGISTRATION_TTL_MS = 24 * 60 * 60 * 1000;
export const UPLOAD_LEASE_MS = 5 * 60 * 1000;
export const CLEANUP_GRACE_MS = 10 * 60 * 1000;
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const hashBuffer = (buffer) =>
  createHash("sha256").update(buffer).digest("hex");
export const later = (ms) => Timestamp.fromMillis(Date.now() + ms);
export function parseRegistrationId(value) {
  if (typeof value !== "string" || !UUID.test(value))
    throw new HttpsError("invalid-argument", "등록 작업을 확인해주세요.");
  return value;
}
export function assertKeys(value, keys) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).length !== keys.length ||
    keys.some((key) => !(key in value))
  )
    throw new HttpsError("invalid-argument", "등록 정보를 확인해주세요.");
}
export function parseProductFields(value) {
  assertKeys(value, ["title", "description", "transaction", "delivery"]);
  const text = (input, max) => {
    if (typeof input !== "string" || !input.trim() || input.trim().length > max)
      throw new HttpsError(
        "invalid-argument",
        "상품 설명과 거래 정보를 확인해주세요.",
      );
    return input.trim();
  };
  const amount = (value) => {
    if (!Number.isSafeInteger(value) || value < 0)
      throw new HttpsError("invalid-argument", "가격과 배송비를 확인해주세요.");
    return value;
  };
  let transaction;
  if (value.transaction?.type === "sale") {
    assertKeys(value.transaction, ["type", "price"]);
    transaction = { type: "sale", price: amount(value.transaction.price) };
  } else {
    assertKeys(value.transaction, ["type", "desiredItemName"]);
    if (value.transaction.type !== "exchange")
      throw new HttpsError("invalid-argument", "거래 방법을 확인해주세요.");
    transaction = {
      type: "exchange",
      desiredItemName: text(value.transaction.desiredItemName, 100),
    };
  }
  let delivery;
  if (value.delivery?.type === "parcel") {
    assertKeys(value.delivery, ["type", "shippingFee"]);
    delivery = {
      type: "parcel",
      shippingFee: amount(value.delivery.shippingFee),
    };
  } else {
    assertKeys(value.delivery, ["type", "location"]);
    if (value.delivery.type !== "direct")
      throw new HttpsError("invalid-argument", "거래 방식을 확인해주세요.");
    delivery = { type: "direct", location: text(value.delivery.location, 200) };
  }
  return {
    title: text(value.title, 100),
    description: text(value.description, 5000),
    transaction,
    delivery,
  };
}
export function parseRegistrationFiles(files, userId, registrationId) {
  if (!Array.isArray(files) || files.length < 1 || files.length > 10)
    throw new HttpsError(
      "invalid-argument",
      "사진은 1장 이상, 10장 이하로 등록해주세요.",
    );
  const ids = new Set();
  return files.map((file) => {
    assertKeys(file, ["id", "name", "contentType", "size", "sha256"]);
    parseRegistrationId(file.id);
    if (
      ids.has(file.id) ||
      typeof file.name !== "string" ||
      !file.name ||
      file.name.length > 255 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.contentType) ||
      !Number.isInteger(file.size) ||
      file.size <= 0 ||
      file.size > 5 * 1024 * 1024 ||
      typeof file.sha256 !== "string" ||
      !/^[0-9a-f]{64}$/.test(file.sha256)
    )
      throw new HttpsError("invalid-argument", "사진 파일을 확인해주세요.");
    ids.add(file.id);
    return {
      id: file.id,
      name: file.name,
      contentType: file.contentType,
      size: file.size,
      sha256: file.sha256,
      path: "products/" + userId + "/" + registrationId + "-" + file.id,
      status: "pending",
    };
  });
}
export async function assertRegistrationUser({ auth }, userId) {
  if (!userId)
    throw new HttpsError("unauthenticated", "로그인 후 상품을 등록해주세요.");
  try {
    if ((await auth.getUser(userId)).disabled) throw new Error("disabled");
  } catch {
    throw new HttpsError(
      "permission-denied",
      "현재 계정으로 상품을 등록할 수 없습니다.",
    );
  }
}
export async function assertNotWithdrawing(transaction, db, userId) {
  if ((await transaction.get(db.doc("withdrawalRequests/" + userId))).exists)
    throw new HttpsError("permission-denied", "탈퇴 처리 중인 계정입니다.");
}
export function ownedRegistration(snapshot, userId) {
  if (!snapshot.exists)
    throw new HttpsError("not-found", "등록 작업을 찾을 수 없습니다.");
  const data = snapshot.data();
  if (data.userId !== userId)
    throw new HttpsError(
      "permission-denied",
      "등록 작업에 접근할 수 없습니다.",
    );
  return data;
}
export function assertPending(data) {
  if (data.status !== "pending" || data.expiresAt.toMillis() <= Date.now())
    throw new HttpsError(
      "failed-precondition",
      "등록 작업이 만료되거나 취소되었습니다. 새로 등록해주세요.",
    );
}
export function registrationView(id, data) {
  return {
    id,
    productId: id,
    status:
      data.status === "pending" && data.expiresAt.toMillis() <= Date.now()
        ? "expired"
        : data.status,
    product: data.product,
    expiresAt: data.expiresAt.toMillis(),
    files: data.files.map(
      ({ id, name, contentType, size, sha256, status, image }) => ({
        id,
        name,
        contentType,
        size,
        sha256,
        status,
        ...(image ? { image } : {}),
      }),
    ),
  };
}
