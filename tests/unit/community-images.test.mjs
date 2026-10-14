import assert from "node:assert/strict";
import test from "node:test";

import { parseCommunityImages } from "../../src/features/community/utils/parseCommunityImages.ts";
import { validateCommunityImages } from "../../src/features/community/utils/validateCommunityImages.ts";

test("사진은 선택사항이며 최대 10장, JPG·PNG·WebP와 5MB 제한을 검증한다", () => {
  validateCommunityImages([]);
  const valid = new File(["image"], "image.png", { type: "image/png" });
  validateCommunityImages(Array(10).fill(valid));
  validateCommunityImages([
    new File([new Uint8Array(5 * 1024 * 1024)], "maximum.webp", {
      type: "image/webp",
    }),
  ]);
  for (const files of [
    Array(11).fill(valid),
    [new File([], "empty.png", { type: "image/png" })],
    [new File(["<svg/>"], "fake.svg", { type: "image/svg+xml" })],
    [
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.jpg", {
        type: "image/jpeg",
      }),
    ],
  ]) {
    assert.throws(() => validateCommunityImages(files));
  }
});

test("사진 주소는 프로젝트 버킷·작성자·게시글·파일 경로와 일치해야 한다", () => {
  const previous = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "demo-collezio.appspot.com";
  const path = "community/user/post/image-1";
  const image = {
    path,
    url: `https://firebasestorage.googleapis.com/v0/b/demo-collezio.appspot.com/o/${encodeURIComponent(path)}?alt=media&token=test`,
  };
  try {
    assert.deepEqual(parseCommunityImages([image], "user", "post"), [image]);
    assert.deepEqual(parseCommunityImages([], "user", "post"), []);
    for (const invalid of [
      { ...image, path: "community/other/post/image-1" },
      { ...image, path: "community/user/other/image-1" },
      {
        ...image,
        url: image.url.replace("demo-collezio.appspot.com", "other-bucket"),
      },
      { ...image, url: image.url.replace("https://", "http://") },
      {
        ...image,
        url: image.url.replace("firebasestorage.googleapis.com", "example.com"),
      },
      { ...image, url: image.url.replace("image-1", "image-2") },
      { ...image, url: "javascript:alert(1)" },
      { ...image, url: image.url + "#fragment" },
    ])
      assert.deepEqual(parseCommunityImages([invalid], "user", "post"), []);
    assert.throws(() =>
      parseCommunityImages(Array(11).fill(image), "user", "post"),
    );
  } finally {
    if (previous === undefined)
      delete process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    else process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = previous;
  }
});
