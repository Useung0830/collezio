import type { TradeTerms } from "@/features/chat/types/tradeProposal";

export function validateTradeTerms(
  value: unknown,
  now = Date.now(),
): TradeTerms {
  if (!value || typeof value !== "object")
    throw new Error("거래 조건을 확인해주세요.");
  const data = value as Record<string, unknown>;
  const isMoney = (amount: unknown) =>
    typeof amount === "number" &&
    Number.isSafeInteger(amount) &&
    amount >= 0 &&
    amount <= 1_000_000_000;
  if (
    !["sale", "exchange"].includes(String(data.kind)) ||
    !isMoney(data.amount) ||
    !isMoney(data.extraAmount) ||
    !["none", "requester", "seller"].includes(String(data.extraPayer)) ||
    !["direct", "parcel"].includes(String(data.method)) ||
    !["requester", "seller", "each"].includes(String(data.shippingPayer)) ||
    typeof data.scheduledAt !== "number" ||
    !Number.isSafeInteger(data.scheduledAt) ||
    data.scheduledAt <= now ||
    data.scheduledAt > now + 366 * 86400000 ||
    typeof data.location !== "string" ||
    data.location.length > 200 ||
    (data.method === "direct" && !data.location.trim()) ||
    typeof data.notes !== "string" ||
    data.notes.length > 1000 ||
    (data.kind === "sale" &&
      (data.exchangeProductId !== null ||
        data.extraAmount !== 0 ||
        data.extraPayer !== "none")) ||
    (data.kind === "exchange" &&
      (data.amount !== 0 ||
        typeof data.exchangeProductId !== "string" ||
        !/^[a-zA-Z0-9-]{1,128}$/.test(data.exchangeProductId))) ||
    (data.extraAmount === 0
      ? data.extraPayer !== "none"
      : data.extraPayer === "none")
  )
    throw new Error(
      "금액, 교환 상품, 미래의 약속 일정과 거래 장소를 확인해주세요.",
    );
  return {
    kind: data.kind as TradeTerms["kind"],
    amount: data.amount as number,
    exchangeProductId: data.exchangeProductId as string | null,
    extraAmount: data.extraAmount as number,
    extraPayer: data.extraPayer as TradeTerms["extraPayer"],
    method: data.method as TradeTerms["method"],
    scheduledAt: data.scheduledAt,
    location: data.location.trim(),
    shippingPayer: data.shippingPayer as TradeTerms["shippingPayer"],
    notes: data.notes.trim(),
  };
}
