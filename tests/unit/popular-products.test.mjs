import assert from "node:assert/strict";
import test from "node:test";

import { Timestamp } from "firebase/firestore";

import { parseProductListItem } from "../../src/features/products/utils/parseProduct.ts";
import { selectPopularProducts } from "../../src/features/products/utils/selectPopularProducts.ts";

function product(id, favoriteCount, createdAt) {
  return parseProductListItem(id, {
    title: id,
    transaction: { type: "sale", price: 1000 },
    favoriteCount,
    createdAt: createdAt ? Timestamp.fromDate(new Date(createdAt)) : undefined,
  });
}

test("찜 수 우선, 동점은 최신순과 ID순으로 상위 4개를 선택한다", () => {
  const products = [
    product("lowest", 0),
    product("b", 5, "2026-09-01"),
    product("newest", 5, "2026-09-02"),
    product("highest", 20, "2026-08-01"),
    product("a", 5, "2026-09-01"),
    product("no-date", 5),
  ];
  const originalOrder = [...products];
  assert.deepEqual(
    selectPopularProducts(products).map(({ id }) => id),
    ["highest", "newest", "a", "b"],
  );
  assert.deepEqual(products, originalOrder);
});

test("빈 목록과 4개 미만, 찜 수와 등록일이 없는 기존 상품을 지원한다", () => {
  assert.deepEqual(selectPopularProducts([]), []);
  const products = [product("legacy"), product("zero", 0, "2026-09-01")];
  assert.deepEqual(
    selectPopularProducts(products).map(({ id, favoriteCount }) => ({
      id,
      favoriteCount,
    })),
    [
      { id: "zero", favoriteCount: 0 },
      { id: "legacy", favoriteCount: 0 },
    ],
  );
});
