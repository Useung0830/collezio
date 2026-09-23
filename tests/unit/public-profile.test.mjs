import assert from "node:assert/strict";
import test from "node:test";

import { parsePublicProfile } from "../../src/features/user/utils/parsePublicProfile.ts";

test("공개 프로필은 실제 값만 반환하고 미집계 지표는 null로 보존한다", () => {
  assert.deepEqual(
    parsePublicProfile("seller", {
      nickname: "판매자",
      email: "private@example.com",
    }),
    {
      id: "seller",
      nickname: "판매자",
      imageUrl: null,
      bio: "",
      rating: null,
      tradeCount: null,
    },
  );
  const profile = parsePublicProfile("seller", {
    nickname: "판매자",
    bio: "소개\n둘째 줄",
    rating: 4.8,
    tradeCount: 0,
  });
  assert.equal(profile.bio, "소개\n둘째 줄");
  assert.equal(profile.rating, 4.8);
  assert.equal(profile.tradeCount, 0);
});

test("잘못된 닉네임은 거부하고 잘못된 지표와 이미지 주소는 표시하지 않는다", () => {
  for (const data of [null, [], {}, { nickname: " " }])
    assert.throws(() => parsePublicProfile("seller", data));
  for (const rating of [-1, 6, NaN, Infinity, "5"]) {
    assert.equal(
      parsePublicProfile("seller", { nickname: "판매자", rating }).rating,
      null,
    );
  }
  for (const tradeCount of [-1, 1.5, "3"]) {
    assert.equal(
      parsePublicProfile("seller", { nickname: "판매자", tradeCount })
        .tradeCount,
      null,
    );
  }
  for (const imageUrl of [
    "javascript:alert(1)",
    "https://example.com/photo",
    "not-a-url",
  ]) {
    assert.equal(
      parsePublicProfile("seller", { nickname: "판매자", imageUrl }).imageUrl,
      null,
    );
  }
});

test("프로젝트 Storage 이미지 주소만 표시한다", () => {
  const previous = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "profile-test";
  try {
    const imageUrl =
      "https://firebasestorage.googleapis.com/v0/b/profile-test/o/profiles%2Fimage?alt=media";
    assert.equal(
      parsePublicProfile("seller", { nickname: "판매자", imageUrl }).imageUrl,
      imageUrl,
    );
    assert.equal(
      parsePublicProfile("seller", {
        nickname: "판매자",
        imageUrl: imageUrl.replace("profile-test", "other-bucket"),
      }).imageUrl,
      null,
    );
  } finally {
    if (previous === undefined)
      delete process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    else process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = previous;
  }
});
