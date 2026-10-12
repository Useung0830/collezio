import { randomUUID } from "node:crypto";

import { HttpsError } from "firebase-functions/v2/https";

import { compressProductImage } from "./compressProductImage.js";
import {
  assertKeys,
  assertNotWithdrawing,
  assertPending,
  assertRegistrationUser,
  hashBuffer,
  later,
  ownedRegistration,
  parseRegistrationId,
  REGISTRATION_TTL_MS,
  UPLOAD_LEASE_MS,
} from "./productRegistrationData.js";

export async function saveProductImage(services, userId, input) {
  await assertRegistrationUser(services, userId);
  assertKeys(input, ["registrationId", "imageId", "base64", "contentType"]);
  const registrationId = parseRegistrationId(input.registrationId);
  const imageId = parseRegistrationId(input.imageId);
  if (
    typeof input.base64 !== "string" ||
    !input.base64.length ||
    input.base64.length > 4 * Math.ceil((5 * 1024 * 1024) / 3) ||
    input.base64.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(input.base64)
  )
    throw new HttpsError("invalid-argument", "사진 파일을 확인해주세요.");
  const buffer = Buffer.from(input.base64, "base64");
  if (buffer.toString("base64") !== input.base64)
    throw new HttpsError("invalid-argument", "사진 파일을 확인해주세요.");
  const sha256 = hashBuffer(buffer);
  const { db, bucket } = services;
  const ref = db.doc("productRegistrations/" + registrationId);
  const leaseId = randomUUID();
  const fileData = await db.runTransaction(async (tx) => {
    await assertNotWithdrawing(tx, db, userId);
    const data = ownedRegistration(await tx.get(ref), userId);
    const file = data.files.find((file) => file.id === imageId);
    if (
      !file ||
      file.sha256 !== sha256 ||
      file.size !== buffer.length ||
      file.contentType !== input.contentType
    )
      throw new HttpsError(
        "invalid-argument",
        "처음 선택한 사진과 일치하지 않습니다.",
      );
    if (data.status === "committed" && file.status === "ready") return file;
    assertPending(data);
    if (file.status === "ready") return file;
    if (file.leaseUntil?.toMillis() > Date.now())
      throw new HttpsError(
        "aborted",
        "사진을 처리 중입니다. 잠시 후 등록 확인을 눌러주세요.",
      );
    const next = { ...file, leaseId, leaseUntil: later(UPLOAD_LEASE_MS) };
    const expiresAt = later(REGISTRATION_TTL_MS);
    tx.update(ref, {
      files: data.files.map((entry) => (entry.id === imageId ? next : entry)),
      expiresAt,
      cleanupAt: expiresAt,
    });
    return next;
  });
  if (fileData.status === "ready") return fileData.image;
  const file = bucket.file(fileData.path);
  try {
    // Reuse a completed Storage write even if the Firestore acknowledgement was lost.
    let metadata;
    try {
      [metadata] = await file.getMetadata();
    } catch (error) {
      if (Number(error.code) !== 404) throw error;
    }
    if (!metadata) {
      const image = await compressProductImage({
        buffer,
        contentType: input.contentType,
      });
      const current = ownedRegistration(await ref.get(), userId);
      assertPending(current);
      if (
        current.files.find((entry) => entry.id === imageId)?.leaseId !== leaseId
      )
        throw new HttpsError("aborted", "다시 등록 확인을 눌러주세요.");
      try {
        await file.save(image.buffer, {
          resumable: false,
          contentType: image.contentType,
          preconditionOpts: { ifGenerationMatch: 0 },
          metadata: {
            cacheControl: "public,max-age=31536000,immutable",
            metadata: {
              firebaseStorageDownloadTokens: fileData.token,
              registrationId,
              sha256,
              width: String(image.width),
              height: String(image.height),
              originalBytes: String(image.originalBytes),
              bytes: String(image.bytes),
              compressionVersion: "1",
            },
          },
        });
      } catch (error) {
        if (Number(error.code) !== 412) throw error;
      }
      [metadata] = await file.getMetadata();
    }
    if (
      metadata.metadata?.sha256 !== sha256 ||
      metadata.metadata?.registrationId !== registrationId
    )
      throw new HttpsError(
        "failed-precondition",
        "저장된 사진을 확인할 수 없습니다.",
      );
    const image = {
      path: fileData.path,
      url:
        "https://firebasestorage.googleapis.com/v0/b/" +
        bucket.name +
        "/o/" +
        encodeURIComponent(fileData.path) +
        "?alt=media&token=" +
        fileData.token,
    };
    await assertRegistrationUser(services, userId);
    await db.runTransaction(async (tx) => {
      await assertNotWithdrawing(tx, db, userId);
      const data = ownedRegistration(await tx.get(ref), userId);
      assertPending(data);
      const current = data.files.find((entry) => entry.id === imageId);
      if (current.leaseId !== leaseId)
        throw new HttpsError("aborted", "다시 등록 확인을 눌러주세요.");
      const ready = { ...current, status: "ready", image };
      delete ready.leaseId;
      delete ready.leaseUntil;
      const expiresAt = later(REGISTRATION_TTL_MS);
      tx.update(ref, {
        files: data.files.map((entry) =>
          entry.id === imageId ? ready : entry,
        ),
        expiresAt,
        cleanupAt: expiresAt,
      });
    });
    return image;
  } catch (error) {
    const [current, withdrawal] = await Promise.all([
      ref.get(),
      db.doc("withdrawalRequests/" + userId).get(),
    ]);
    if (
      !current.exists ||
      ["cleaning", "cleaned"].includes(current.get("status")) ||
      withdrawal.exists
    )
      await file.delete({ ignoreNotFound: true });
    else
      await db.runTransaction(async (tx) => {
        const snapshot = await tx.get(ref);
        if (!snapshot.exists || snapshot.get("status") !== "pending") return;
        tx.update(ref, {
          files: snapshot.get("files").map((entry) => {
            if (entry.id !== imageId || entry.leaseId !== leaseId) return entry;
            const next = { ...entry };
            delete next.leaseId;
            delete next.leaseUntil;
            return next;
          }),
        });
      });
    throw error;
  }
}
