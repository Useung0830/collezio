import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import type { TradeProposal } from "@/features/chat/types/tradeProposal";
import { getRegisteredProduct } from "@/features/products/api/getRegisteredProduct";

export default function TradeProposalDetails({
  proposal,
  userId,
}: {
  proposal: TradeProposal;
  userId: string;
}) {
  const terms = proposal.terms;
  const product = useQuery({
    queryKey: ["products", "trade-detail", proposal.productId, userId],
    queryFn: () => getRegisteredProduct(proposal.productId, userId),
  });
  const exchange = useQuery({
    queryKey: ["products", "trade-detail", terms.exchangeProductId, userId],
    enabled: !!terms.exchangeProductId,
    queryFn: () => getRegisteredProduct(terms.exchangeProductId!, userId),
  });
  const payer = {
    requester: "구매·교환 신청자",
    seller: "상품 등록자",
    each: "각자 부담",
    none: "없음",
  };
  return (
    <div className="text-body-14 space-y-3 py-4">
      <Link
        className="block underline"
        href={`/products/${proposal.productId}`}
      >
        {product.data?.title ?? "대상 상품 확인"}
      </Link>
      {terms.exchangeProductId && (
        <>
          <p>↔ 교환할 상품</p>
          <Link
            className="block underline"
            href={`/products/${terms.exchangeProductId}`}
          >
            {exchange.data?.title ?? "교환 상품 확인"}
          </Link>
        </>
      )}
      <p>
        {terms.kind === "sale"
          ? `거래 금액: ${terms.amount.toLocaleString()}원`
          : `추가금: ${terms.extraAmount.toLocaleString()}원${terms.extraAmount ? ` (${payer[terms.extraPayer]} 지급)` : ""}`}
      </p>
      <p>거래 방식: {terms.method === "direct" ? "직거래" : "택배"}</p>
      <p>
        {terms.method === "direct" ? "약속" : "발송 예정"}:{" "}
        {new Date(terms.scheduledAt).toLocaleString("ko-KR")}
      </p>
      {terms.method === "direct" ? (
        <p className="wrap-anywhere">장소: {terms.location}</p>
      ) : (
        <p>택배비: {payer[terms.shippingPayer]}</p>
      )}
      {terms.notes && (
        <p className="wrap-anywhere whitespace-pre-wrap">
          요청사항: {terms.notes}
        </p>
      )}
    </div>
  );
}
