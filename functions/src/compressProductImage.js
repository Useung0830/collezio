import { HttpsError } from "firebase-functions/v2/https";
import sharp from "sharp";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;
const WEBP_QUALITY = 90;
const IMAGE_FORMATS = new Map([
  ["image/jpeg", "jpeg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

/**
 * Compress one uploaded image without resizing or cropping it.
 * Authentication and storage belong to the upload handler that calls this function.
 * Orientation correction can swap width and height, but preserves the pixel count.
 */
export async function compressProductImage(input) {
  const buffer = input?.buffer;
  const contentType = input?.contentType;
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new HttpsError("invalid-argument", "사진 파일을 확인해주세요.");
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new HttpsError("invalid-argument", "사진은 5MB 이하로 등록해주세요.");
  }
  const expectedFormat = IMAGE_FORMATS.get(contentType);
  if (!expectedFormat) {
    throw new HttpsError(
      "invalid-argument",
      "JPG, PNG, WebP 사진만 등록할 수 있습니다.",
    );
  }

  const image = sharp(buffer, {
    limitInputPixels: MAX_IMAGE_PIXELS,
    failOn: "warning",
  });
  let metadata;
  let compressed;
  let outputContentType = "image/webp";
  try {
    metadata = await image.metadata();
    if (
      metadata.format !== expectedFormat ||
      !metadata.width ||
      !metadata.height ||
      metadata.width * metadata.height > MAX_IMAGE_PIXELS ||
      (metadata.pages ?? 1) !== 1
    ) {
      throw new HttpsError(
        "invalid-argument",
        "형식이 일치하는 4천만 픽셀 이하의 정지 사진을 등록해주세요.",
      );
    }
    // A full decode rejects truncated files; output metadata is stripped by default.
    compressed = await image
      .autoOrient()
      .webp({ quality: WEBP_QUALITY, alphaQuality: 100, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    if (compressed.data.length >= buffer.length) {
      const normalized = image.clone().autoOrient();
      if (expectedFormat === "png") normalized.png();
      else if (expectedFormat === "jpeg")
        normalized.jpeg({ quality: 100, chromaSubsampling: "4:4:4" });
      else normalized.webp({ lossless: true });
      const fallback = await normalized.toBuffer({ resolveWithObject: true });
      if (fallback.data.length < compressed.data.length) {
        compressed = fallback;
        outputContentType = contentType;
      }
    }
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError(
      "invalid-argument",
      "사진을 읽을 수 없습니다. 손상 여부와 해상도를 확인해주세요.",
    );
  }

  if (compressed.data.length > buffer.length) {
    // Never return unprocessed metadata or silently store a larger file.
    throw new HttpsError(
      "failed-precondition",
      "사진 정보를 정리하면서 용량을 줄일 수 없습니다. 다른 사진을 선택해주세요.",
    );
  }
  return {
    buffer: compressed.data,
    contentType: outputContentType,
    width: compressed.info.width,
    height: compressed.info.height,
    originalBytes: buffer.length,
    bytes: compressed.data.length,
    isCompressed: compressed.data.length < buffer.length,
  };
}
