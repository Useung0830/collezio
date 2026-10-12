import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import sharp from "sharp";

import { compressProductImage } from "../src/compressProductImage.js";

const fixture = new URL(
  "../../src/assets/images/product-luffy-cutout.png",
  import.meta.url,
);

async function createImage(options = {}) {
  return sharp({
    create: {
      width: 80,
      height: 40,
      channels: 4,
      background: { r: 180, g: 40, b: 70, alpha: 0.5 },
      ...options,
    },
  })
    .png()
    .toBuffer();
}

test("상품 사진의 해상도와 투명도를 유지하면서 용량을 줄인다", async () => {
  const buffer = await readFile(fixture);
  const original = Buffer.from(buffer);
  const result = await compressProductImage({
    buffer,
    contentType: "image/png",
  });
  assert.equal(result.contentType, "image/webp");
  assert.equal(result.width, 1254);
  assert.equal(result.height, 1254);
  assert.ok(result.bytes < buffer.length);
  assert.equal(result.bytes, result.buffer.length);
  assert.equal(result.originalBytes, buffer.length);
  assert.equal(result.isCompressed, true);
  assert.deepEqual(buffer, original);
  assert.deepEqual(
    await sharp(buffer).extractChannel("alpha").raw().toBuffer(),
    await sharp(result.buffer).extractChannel("alpha").raw().toBuffer(),
  );
});

test("회전 방향을 보정하고 EXIF와 XMP를 제거한다", async () => {
  const buffer = await sharp(await createImage())
    .withMetadata({ orientation: 6 })
    .withXmp('<x:xmpmeta xmlns:x="adobe:ns:meta/">private-location</x:xmpmeta>')
    .jpeg()
    .toBuffer();
  const result = await compressProductImage({
    buffer,
    contentType: "image/jpeg",
  });
  const metadata = await sharp(result.buffer).metadata();
  assert.equal(result.width, 40);
  assert.equal(result.height, 80);
  assert.equal(metadata.orientation, undefined);
  for (const field of ["exif", "xmp", "iptc", "icc"])
    assert.equal(metadata[field], undefined);
});

test("JPEG와 WebP 입력을 처리하고 실제 출력 형식을 반환한다", async () => {
  for (const format of ["jpeg", "webp"]) {
    const buffer = await sharp(await createImage())
      .withMetadata()
      .toFormat(format)
      .toBuffer();
    const result = await compressProductImage({
      buffer,
      contentType: "image/" + format,
    });
    const metadata = await sharp(result.buffer).metadata();
    assert.equal(result.contentType, "image/" + metadata.format);
    assert.equal(result.width, 80);
    assert.equal(result.height, 40);
    assert.ok(result.bytes <= buffer.length);
  }
});

test("빈 파일, 용량 초과, 지원하지 않는 형식을 거부한다", async () => {
  for (const input of [
    undefined,
    null,
    {},
    { buffer: Buffer.alloc(0), contentType: "image/png" },
    { buffer: Buffer.alloc(5 * 1024 * 1024 + 1), contentType: "image/png" },
    { buffer: await createImage(), contentType: "image/heic" },
  ]) {
    await assert.rejects(compressProductImage(input), {
      code: "invalid-argument",
    });
  }
});

test("MIME 위조와 손상된 파일을 거부한다", async () => {
  const png = await createImage();
  for (const input of [
    { buffer: png, contentType: "image/jpeg" },
    { buffer: Buffer.from("not an image"), contentType: "image/png" },
    {
      buffer: png.subarray(0, Math.floor(png.length / 2)),
      contentType: "image/png",
    },
  ]) {
    await assert.rejects(compressProductImage(input), {
      code: "invalid-argument",
    });
  }
});

test("애니메이션을 첫 프레임으로 조용히 바꾸지 않는다", async () => {
  const frames = Buffer.concat([
    Buffer.alloc(8 * 8 * 3, 0),
    Buffer.alloc(8 * 8 * 3, 255),
  ]);
  const buffer = await sharp(frames, {
    raw: { width: 8, height: 16, channels: 3, pageHeight: 8 },
  })
    .webp({ loop: 0, delay: [100, 100] })
    .toBuffer();
  assert.equal((await sharp(buffer).metadata()).pages, 2);
  await assert.rejects(
    compressProductImage({ buffer, contentType: "image/webp" }),
    { code: "invalid-argument" },
  );
});

test("4천만 픽셀을 넘는 이미지를 축소하지 않고 거부한다", async () => {
  const buffer = await createImage({ width: 6401, height: 6250, channels: 3 });
  await assert.rejects(
    compressProductImage({ buffer, contentType: "image/png" }),
    { code: "invalid-argument" },
  );
});

test("이미 작은 무손실 WebP는 용량을 늘리지 않는다", async () => {
  const buffer = await sharp(await createImage({ width: 1, height: 1 }))
    .webp({ lossless: true })
    .toBuffer();
  const result = await compressProductImage({
    buffer,
    contentType: "image/webp",
  });
  assert.ok(result.bytes <= buffer.length);
  assert.equal(result.width, 1);
  assert.equal(result.height, 1);
  assert.deepEqual(
    await sharp(result.buffer).raw().toBuffer(),
    await sharp(buffer).raw().toBuffer(),
  );
});

test("두 변환 결과가 모두 더 크면 원본을 되돌리지 않고 명확한 오류를 반환한다", async () => {
  const pixels = Buffer.from(
    Array.from(
      { length: 16 * 16 * 3 },
      (_, index) => (index * 73 + index * index) % 256,
    ),
  );
  const buffer = await sharp(pixels, {
    raw: { width: 16, height: 16, channels: 3 },
  })
    .webp({ quality: 1 })
    .toBuffer();
  await assert.rejects(
    compressProductImage({ buffer, contentType: "image/webp" }),
    { code: "failed-precondition" },
  );
});
