import Link from "next/link";

import MatchProposalCard from "@/features/matching/components/MatchProposalCard";
import type { MatchProposal } from "@/features/matching/types/match";
import type { CompletedTrade } from "@/features/review/types/review";
import TradePartnerSummary from "@/features/trade/components/TradePartnerSummary";

import SingleTradeProductImage from "./SingleTradeProductImage";

type CompletedTradeCardProps = {
  trade: CompletedTrade;
};

const tradeLabels = {
  exchange: "교환 완료",
  purchase: "구매 완료",
  sale: "판매 완료",
} as const;

const tradeMethodLabels = {
  direct: "직거래",
  parcel: "택배 거래",
} as const;

export default function CompletedTradeCard({ trade }: CompletedTradeCardProps) {
  if (trade.type === "exchange") {
    const completedProposal: MatchProposal = {
      id: trade.id,
      type: "received",
      title: trade.receivedProduct.title,
      createdAt: trade.completedAt,
      status: "거래 완료",
      description: "서로의 상품을 교환한 거래예요.",
      location: "거래 완료",
      ownedProductImage: trade.ownedProduct.image,
      proposedProductImage: trade.receivedProduct.image,
      ownerName: trade.partnerName,
      ownerImage: trade.partnerImage,
      tradeCount: trade.partnerTradeCount,
      rating: trade.partnerRating,
    };

    return (
      <MatchProposalCard proposal={completedProposal} variant="completed" />
    );
  }

  return (
    <article className="border-black-200 text-black-900 flex flex-col gap-5 rounded-2xl border p-5 md:flex-row md:items-center">
      <SingleTradeProductImage trade={trade} />

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="bg-black-100 text-caption-12-bold inline-flex rounded-full px-3 py-1">
              {tradeLabels[trade.type]}
            </span>
            <Link href={`/products/${trade.product.id}`}>
              <h3 className="text-heading-20 mt-2 truncate">
                {trade.product.title}
              </h3>
            </Link>
          </div>
          <time className="text-caption-12 text-black-600 shrink-0">
            {trade.completedAt}
          </time>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <p className="text-label-16">
            {trade.price.toLocaleString("ko-KR")}원
          </p>
          <span className="bg-black-100 text-caption-12 rounded-full px-3 py-1">
            {tradeMethodLabels[trade.tradeMethod]}
          </span>
        </div>

        <TradePartnerSummary
          image={trade.partnerImage}
          name={trade.partnerName}
          tradeCount={trade.partnerTradeCount}
          rating={trade.partnerRating}
        />
      </div>
    </article>
  );
}
