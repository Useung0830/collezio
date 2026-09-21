import assert from "node:assert/strict";
import test from "node:test";

import { Timestamp } from "firebase/firestore";

import { parseMyProduct } from "../../src/features/products/utils/parseMyProduct.ts";

const storedProduct = {
  title: "교환할 피규어",
  transaction: { type: "exchange", desiredItemName: "탄지로 피규어" },
  images: [
    {
      url: "https://firebasestorage.googleapis.com/v0/b/example/o/products%2Fuser%2Fimage?alt=media&token=example",
      path: "products/user/image",
    },
  ],
  createdAt: Timestamp.fromDate(new Date("2026-09-21T00:00:00Z")),
  status: "available",
};

test("등록 API가 저장한 문서를 문자열 ID와 대표 사진을 가진 카드로 변환한다", () => {
  const product = parseMyProduct("firestore-document-id", storedProduct);
  assert.equal(product.id, "firestore-document-id");
  assert.equal(product.image, storedProduct.images[0].url);
  assert.equal(product.createdAt, "2026-09-21T00:00:00.000Z");
  assert.equal(product.status, "available");
  assert.deepEqual(product.transaction, storedProduct.transaction);
  assert.equal(product.favoriteCount, 0);
  assert.equal(product.chatCount, 0);
});

test("판매 상품과 거래 상태를 보존한다", () => {
  for (const status of ["reserved", "completed"]) {
    const product = parseMyProduct("sale", {
      ...storedProduct,
      transaction: { type: "sale", price: 12000 },
      status,
      favoriteCount: 3,
      chatCount: 2,
    });
    assert.deepEqual(product.transaction, { type: "sale", price: 12000 });
    assert.equal(product.status, status);
    assert.equal(product.favoriteCount, 3);
    assert.equal(product.chatCount, 2);
  }
});

test("사진·등록일·알 수 없는 상태는 가짜 값 대신 빈 값으로 표시한다", () => {
  const product = parseMyProduct("legacy", {
    ...storedProduct,
    images: [],
    createdAt: null,
    status: "unexpected",
    favoriteCount: -1,
    chatCount: "2",
  });
  assert.equal(product.image, null);
  assert.equal(product.createdAt, null);
  assert.equal(product.status, null);
  assert.equal(product.favoriteCount, 0);
  assert.equal(product.chatCount, 0);
});

test("허용하지 않은 이미지 URL을 카드에 전달하지 않는다", () => {
  for (const url of [
    "javascript:alert(1)",
    "https://example.com/image.png",
    "http://firebasestorage.googleapis.com/image",
    "not-a-url",
  ]) {
    assert.equal(
      parseMyProduct("image", { ...storedProduct, images: [{ url }] }).image,
      null,
    );
  }
});

test("잘못된 필수 필드와 거래 정보를 성공한 조회로 취급하지 않는다", () => {
  for (const data of [
    null,
    { ...storedProduct, title: " " },
    { ...storedProduct, transaction: { type: "sale", price: -1 } },
    { ...storedProduct, transaction: { type: "sale", price: NaN } },
    {
      ...storedProduct,
      transaction: { type: "exchange", desiredItemName: "" },
    },
  ]) {
    assert.throws(() => parseMyProduct("invalid", data));
  }
});
