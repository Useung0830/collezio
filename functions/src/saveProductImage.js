import { randomUUID } from "node:crypto";

import { HttpsError } from "firebase-functions/v2/https";

import { compressProductImage } from "./compressProductImage.js";

const MAX_BASE64_LENGTH = 4 * Math.ceil((5 * 1024 * 1024) / 3);

function parseImageInput(input) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).some(
      (key) => !["base64", "contentType"].includes(key),
    ) ||
    typeof input.base64 !== "string" ||
    input.base64.length === 0 ||
    input.base64.length > MAX_BASE64_LENGTH ||
    input.base64.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(input.base64)
  ) {
    throw new HttpsError("invalid-argument", "사진 파일을 확인해주세요.");
  }
  const buffer = Buffer.from(input.base64, "base64");
  if (buffer.toString("base64") !== input.base64) {
    throw new HttpsError("invalid-argument", "사진 파일을 확인해주세요.");
  }
  return { buffer, contentType: input.contentType };
}

async function assertActiveUser({ auth, db }, userId) {
  const [user, withdrawal] = await Promise.all([
    auth.getUser(userId),
    db.doc(`withdrawalRequests/${userId}`).get(),
  ]);
  if (user.disabled || withdrawal.exists) {
    throw new HttpsError(
      "permission-denied",
      "현재 계정으로 사진을 등록할 수 없습니다.",
    );
  }
}

export async function saveProductImage(services, userId, input) {
  if (!userId)
    throw new HttpsError("unauthenticated", "로그인 후 사진을 등록해주세요.");
  const imageInput = parseImageInput(input);
  await assertActiveUser(services, userId);
  const image = await compressProductImage(imageInput);
  await assertActiveUser(services, userId);

  const path = `products/${userId}/${randomUUID()}`;
  const file = services.bucket.file(path);
  const token = randomUUID();
  await file.save(image.buffer, {
    resumable: false,
    contentType: image.contentType,
    preconditionOpts: { ifGenerationMatch: 0 },
    metadata: {
      cacheControl: "public,max-age=31536000,immutable",
      metadata: {
        firebaseStorageDownloadTokens: token,
        width: String(image.width),
        height: String(image.height),
        originalBytes: String(image.originalBytes),
        bytes: String(image.bytes),
        compressionVersion: "1",
      },
    },
  });
  try {
    // Withdrawal cleanup may run while the file is being saved.
    await assertActiveUser(services, userId);
  } catch (error) {
    await file.delete({ ignoreNotFound: true });
    throw error;
  }

  return {
    path,
    url: `https://firebasestorage.googleapis.com/v0/b/${services.bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`,
  };
}
