import assert from "node:assert/strict";
import test from "node:test";

import { PRODUCT_CATEGORIES } from "../../functions/src/productRegistrationData.js";
import { getProductTitleTerms } from "../../functions/src/productSearchTerms.js";
import { PRODUCT_CATEGORIES as CLIENT_CATEGORIES } from "../../src/features/products/constants/productCategories.ts";
import { normalizeProductSearch } from "../../src/features/products/utils/normalizeProductSearch.ts";

test("제목의 중간 단어와 연속된 단어를 검색하고 단어 내부 일부는 제외한다", () => {
  const terms = getProductTitleTerms("원피스 미니 피규어 (한정판)");
  assert.ok(terms.includes(normalizeProductSearch("피규어")));
  assert.ok(terms.includes(normalizeProductSearch("미니 피규어")));
  assert.ok(terms.includes(normalizeProductSearch("한정판")));
  assert.ok(!terms.includes(normalizeProductSearch("규어")));
  assert.ok(!terms.includes(normalizeProductSearch("피규")));
});

test("서버와 화면의 카테고리 값이 일치한다", () => {
  assert.deepEqual(
    CLIENT_CATEGORIES.map((category) => category.value),
    PRODUCT_CATEGORIES,
  );
});
