import assert from "node:assert/strict";
import test from "node:test";

import { validateTradeTerms } from "../../src/features/chat/utils/validateTradeTerms.ts";

const now = Date.now();
const terms = {
  kind: "sale",
  amount: 25000,
  exchangeProductId: null,
  extraAmount: 0,
  extraPayer: "none",
  method: "direct",
  scheduledAt: now + 86400000,
  location: " 강남역 ",
  shippingPayer: "requester",
  notes: "",
};
test("거래 조건은 날짜·금액·장소와 교환 추가금 지급자를 검증한다", () => {
  assert.equal(validateTradeTerms(terms, now).location, "강남역");
  for (const patch of [
    { scheduledAt: now },
    { amount: -1 },
    { amount: 0.1 },
    { location: " " },
    { extraAmount: 1000 },
    { kind: "exchange" },
    { notes: "x".repeat(1001) },
  ])
    assert.throws(() => validateTradeTerms({ ...terms, ...patch }, now));
  const exchange = {
    ...terms,
    kind: "exchange",
    amount: 0,
    exchangeProductId: "item-1",
    extraAmount: 1000,
    extraPayer: "seller",
  };
  assert.equal(validateTradeTerms(exchange, now).extraPayer, "seller");
  assert.throws(() =>
    validateTradeTerms({ ...exchange, exchangeProductId: "other/item" }, now),
  );
});
