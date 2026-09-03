import type {
  MatchProposal,
  MatchProposalType,
} from "@/features/matching/types/match";
import TradePartnerSummary from "@/features/trade/components/TradePartnerSummary";

import ExchangeIcon from "@/assets/icons/icon-exchange.svg";
import PinIcon from "@/assets/icons/icon-pin.svg";
import StarIcon from "@/assets/icons/icon-star.svg";

import MatchActionButton from "./MatchActionButton";
import MatchProductThumbnail from "./MatchProductThumbnail";

type MatchProposalCardProps = {
  proposal: MatchProposal;
  variant?: "proposal" | "completed";
};

const proposalLabels: Record<MatchProposalType, string> = {
  received: "받은 제안",
  sent: "보낸 제안",
  recommended: "추천",
};

const proposalLabelColors: Record<MatchProposalType, string> = {
  received: "text-brand-blue",
  sent: "text-brand-green",
  recommended: "text-black-900",
};

export default function MatchProposalCard({
  proposal,
  variant = "proposal",
}: MatchProposalCardProps) {
  const isReceived = proposal.type === "received";
  const isSent = proposal.type === "sent";
  const isCompleted = variant === "completed";

  return (
    <article className="border-black-200 text-black-900 rounded-2xl border px-6 py-4">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex shrink-0 items-end self-center md:self-auto">
          <MatchProductThumbnail
            label="내 상품"
            image={proposal.ownedProductImage}
            alt="내 상품 이미지"
          />
          <div className="border-black-200 z-10 -mx-3 mb-7 flex size-10 items-center justify-center rounded-full border bg-white sm:mb-8 md:mb-10">
            <ExchangeIcon className="size-5" aria-label="상품 교환" />
          </div>
          <MatchProductThumbnail
            label={isCompleted ? "받은 상품" : "제안 상품"}
            image={proposal.proposedProductImage}
            alt="제안 상품 이미지"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 md:justify-between">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-heading-20 min-w-0 truncate">
              {proposal.title}
            </h3>
            <p className="text-caption-12 text-black-600 shrink-0">
              {proposal.createdAt}
            </p>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`bg-black-100 text-caption-12 flex items-center gap-1 rounded-full px-3 py-1 ${proposalLabelColors[proposal.type]}`}
                >
                  {!isCompleted && proposal.type === "recommended" && (
                    <StarIcon className="size-4" aria-hidden="true" />
                  )}
                  {isCompleted ? "교환 완료" : proposalLabels[proposal.type]}
                </span>
                <span className="bg-black-100 text-caption-12 rounded-full px-3 py-1">
                  직거래 희망
                </span>
                <span className="bg-black-100 text-caption-12 flex items-center gap-1 rounded-full px-3 py-1">
                  <PinIcon className="size-3" aria-hidden="true" />
                  {proposal.location}
                </span>
              </div>
              <p className="text-body-14 text-black-600 whitespace-pre-line">
                {proposal.description}
              </p>
              <TradePartnerSummary
                image={proposal.ownerImage}
                name={proposal.ownerName}
                tradeCount={proposal.tradeCount}
                rating={proposal.rating}
              />
            </div>

            {!isCompleted && (
              <div
                className={`border-black-200 grid w-full shrink-0 gap-2 border-t pt-4 md:flex md:w-auto md:justify-end md:border-t-0 md:pt-0 [&>button]:w-full md:[&>button]:w-auto ${isSent ? "grid-cols-1" : "grid-cols-2"}`}
              >
                {isReceived && (
                  <>
                    <MatchActionButton variant="primary">
                      수락하기
                    </MatchActionButton>
                    <MatchActionButton>거절하기</MatchActionButton>
                  </>
                )}
                {isSent && <MatchActionButton>제안취소</MatchActionButton>}
                {proposal.type === "recommended" && (
                  <>
                    <MatchActionButton variant="primary">
                      자세히 보기
                    </MatchActionButton>
                    <MatchActionButton>닫기</MatchActionButton>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
