import type {
  TradeCompletion,
  TradeReview,
} from "@/features/chat/types/tradeCompletion";

export function parseTradeCompletion(
  data: Record<string, unknown> | undefined,
): TradeCompletion {
  if (!data) return { confirmedBy: [], deferredBy: [], reviewedBy: [] };
  const { confirmedBy, deferredBy, reviewedBy } = data;
  if (
    ![confirmedBy, deferredBy, reviewedBy].every(
      (value) =>
        Array.isArray(value) &&
        value.length <= 2 &&
        value.every((id) => typeof id === "string"),
    )
  )
    throw new Error("거래 완료 상태를 확인할 수 없습니다.");
  return { confirmedBy, deferredBy, reviewedBy } as TradeCompletion;
}

export function parseTradeReview(data: Record<string, unknown>): TradeReview {
  if (
    typeof data.rating !== "number" ||
    !Number.isInteger(data.rating) ||
    data.rating < 1 ||
    data.rating > 5 ||
    typeof data.content !== "string" ||
    !data.content.trim() ||
    data.content.length > 1000
  )
    throw new Error("평점과 후기 내용을 확인해주세요.");
  return { rating: data.rating, content: data.content.trim() };
}
