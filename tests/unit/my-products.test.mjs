import assert from "node:assert/strict";
import test from "node:test";

import { Timestamp } from "firebase/firestore";

import {
  parseMyProduct,
  parseRegisteredProduct,
} from "../../src/features/products/utils/parseProduct.ts";

const storedProduct = {
  sellerId: "seller-uid",
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

test("상세 정보는 설명 줄바꿈과 직거래 장소 및 모든 유효한 사진을 보존한다", () => {
  const secondImage = { url: storedProduct.images[0].url + "2" };
  const product = parseRegisteredProduct("document-id", {
    ...storedProduct,
    description: "첫째 줄\n둘째 줄",
    delivery: { type: "direct", location: "서울역 1번 출구" },
    images: [
      ...storedProduct.images,
      secondImage,
      { url: "https://example.com/photo" },
      secondImage,
    ],
  });
  assert.equal(product.description, "첫째 줄\n둘째 줄");
  assert.equal(product.sellerId, "seller-uid");
  assert.deepEqual(product.delivery, {
    type: "direct",
    location: "서울역 1번 출구",
  });
  assert.deepEqual(product.imageUrls, [
    storedProduct.images[0].url,
    secondImage.url,
  ]);
});

test("판매자 ID가 누락되거나 경로이면 상품 내용은 유지하고 프로필 조회는 생략한다", () => {
  for (const sellerId of [null, undefined, "", " ", "profiles/user", ".", ".."])
    assert.equal(
      parseRegisteredProduct("product", {
        ...storedProduct,
        sellerId,
        description: "설명",
        delivery: { type: "parcel", shippingFee: 0 },
      }).sellerId,
      null,
    );
});

test("택배 상품의 무료 배송과 유료 배송을 구분하고 잘못된 상세 필드는 거부한다", () => {
  const data = {
    ...storedProduct,
    description: "상품 설명",
    delivery: { type: "parcel", shippingFee: 0 },
  };
  for (const shippingFee of [0, 3500]) {
    assert.deepEqual(
      parseRegisteredProduct("parcel", {
        ...data,
        delivery: { type: "parcel", shippingFee },
      }).delivery,
      { type: "parcel", shippingFee },
    );
  }
  for (const delivery of [
    null,
    { type: "direct", location: "" },
    { type: "parcel", shippingFee: -1 },
    { type: "parcel", shippingFee: "3000" },
  ]) {
    assert.throws(() =>
      parseRegisteredProduct("invalid", { ...data, delivery }),
    );
  }
  assert.throws(() =>
    parseRegisteredProduct("invalid", { ...data, description: null }),
  );
});
