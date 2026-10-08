"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateTradeCompletion } from "@/features/chat/api/updateTradeCompletion";
import TradeReviewDialog from "@/features/chat/components/TradeReviewDialog";
import { useTradeCompletion } from "@/features/chat/hooks/useTradeCompletion";
import type { TradeProposal } from "@/features/chat/types/tradeProposal";

interface TradeCompletionCardProps {
  roomId: string;
  userId: string;
  requesterId: string;
  proposal: TradeProposal;
  hasPendingProposal: boolean;
}

export default function TradeCompletionCard({
  roomId,
  userId,
  requesterId,
  proposal,
  hasPendingProposal,
}: TradeCompletionCardProps) {
  const query = useTradeCompletion(roomId, userId, proposal.id);
  const client = useQueryClient();
  const cardRef = useRef<HTMLLIElement>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const mutation = useMutation({
    mutationFn: (isConfirmed: boolean) =>
      updateTradeCompletion(roomId, userId, proposal.id, isConfirmed),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["chat"] });
      await client.invalidateQueries({ queryKey: ["products"] });
    },
  });
  const completion = query.data;
  const isCompleted = completion?.confirmedBy.length === 2;
  const hasConfirmed = completion?.confirmedBy.includes(userId);
  const hasDeferred = completion?.deferredBy.includes(userId);
  const hasReviewed = completion?.reviewedBy.includes(userId);
  const hasPartnerReviewed = completion?.reviewedBy.some((id) => id !== userId);
  const label =
    proposal.terms.kind === "exchange"
      ? "교환"
      : userId === requesterId
        ? "구매"
        : "판매";
  useEffect(() => {
    cardRef.current?.scrollIntoView({ block: "nearest" });
  }, [isCompleted]);
  return (
    <li
      ref={cardRef}
      aria-label="거래 완료 안내"
      className="text-body-14 text-black-900 border-black-200 mx-auto w-full max-w-80 rounded-xl border bg-white p-4"
    >
      {query.isPending ? (
        <p role="status">거래 완료 상태를 확인하고 있어요.</p>
      ) : query.isError ? (
        <>
          <p role="alert">거래 완료 상태를 불러오지 못했어요.</p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="mt-3 rounded-lg border p-3"
          >
            다시 시도
          </button>
        </>
      ) : isCompleted ? (
        <>
          <p className="text-label-16">두 분 모두 거래를 완료했어요</p>
          {completion?.partnerReview ? (
            <div
              aria-label="상대방이 남긴 후기"
              className="mt-3 flex flex-col gap-2"
            >
              <p className="text-label-14">
                상대방이 남긴 후기 · {completion.partnerReview.rating}점
              </p>
              <p className="wrap-anywhere whitespace-pre-wrap">
                {completion.partnerReview.content}
              </p>
            </div>
          ) : hasReviewed ? (
            <p role="status" className="mt-3">
              후기를 제출했어요. 상대방도 후기를 작성하면 서로의 평점과 후기가
              공개돼요.
            </p>
          ) : (
            <>
              <p className="mt-3">
                {hasPartnerReviewed
                  ? "상대방이 후기를 남겼어요. 나도 후기를 작성하면 서로의 후기를 볼 수 있어요."
                  : "상대방과의 거래는 어떠셨나요? 두 분 모두 작성하면 평점과 후기가 서로에게 공개돼요."}
              </p>
              <button
                type="button"
                onClick={() => setIsReviewOpen(true)}
                className="bg-brand-blue mt-3 w-full rounded-lg p-3 text-white"
              >
                후기 남기기
              </button>
            </>
          )}
        </>
      ) : (
        <>
          <p className="text-label-16">
            {label}
            {label === "교환" ? "을" : "를"} 완료하셨나요?
          </p>
          <p className="mt-2">
            {proposal.terms.method === "parcel"
              ? "설정한 발송 시간이 지났어요. 상품을 받고 거래가 끝났다면 완료를 눌러주세요."
              : "약속 시간이 지났어요. 거래가 끝났다면 완료를 눌러주세요."}
          </p>
          {hasConfirmed ? (
            <p role="status" className="mt-3">
              완료를 확인했어요. 상대방도 완료를 누르면 후기를 남길 수 있어요.
            </p>
          ) : (
            <>
              {hasDeferred && (
                <p role="status" className="mt-3">
                  아직 거래 중이에요. 거래가 끝나면 아래 완료 버튼을 눌러주세요.
                </p>
              )}
              {completion?.confirmedBy.length === 1 && (
                <p className="mt-3">상대방은 거래 완료를 확인했어요.</p>
              )}
              {hasPendingProposal && (
                <p className="mt-3">조건 변경 제안을 먼저 처리해주세요.</p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={mutation.isPending || hasPendingProposal}
                  onClick={() => mutation.mutate(true)}
                  className="bg-brand-blue flex-1 rounded-lg p-3 text-white disabled:opacity-50"
                >
                  {label} 완료
                </button>
                <button
                  type="button"
                  disabled={
                    mutation.isPending || hasPendingProposal || hasDeferred
                  }
                  onClick={() => mutation.mutate(false)}
                  className="flex-1 rounded-lg border p-3 disabled:opacity-50"
                >
                  아직이에요
                </button>
              </div>
              <p className="text-caption-12 mt-2">
                두 분 모두 완료해야 후기를 작성할 수 있어요.
              </p>
            </>
          )}
        </>
      )}
      {mutation.isError && (
        <p role="alert" className="mt-3">
          {mutation.error.message}
        </p>
      )}
      {isReviewOpen && isCompleted && !hasReviewed && (
        <TradeReviewDialog
          roomId={roomId}
          userId={userId}
          proposalId={proposal.id}
          onClose={() => setIsReviewOpen(false)}
        />
      )}
    </li>
  );
}
