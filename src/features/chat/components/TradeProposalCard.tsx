"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { respondToTradeProposal } from "@/features/chat/api/respondToTradeProposal";
import ChatActionDialog from "@/features/chat/components/ChatActionDialog";
import TradeProposalDetails from "@/features/chat/components/TradeProposalDetails";
import { useTradeProposals } from "@/features/chat/hooks/useTradeProposals";

export default function TradeProposalCard({
  roomId,
  userId,
  proposalId,
}: {
  roomId: string;
  userId: string;
  proposalId: string;
}) {
  const query = useTradeProposals(roomId, userId);
  const client = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const handleRespond = async (
    action: "accepted" | "rejected" | "withdrawn",
  ) => {
    if (isPending) return;
    setIsPending(true);
    setError("");
    try {
      await respondToTradeProposal(roomId, userId, proposalId, action);
      await client.invalidateQueries({ queryKey: ["chat"] });
      await client.invalidateQueries({ queryKey: ["products"] });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "제안을 처리하지 못했습니다.",
      );
    } finally {
      setIsPending(false);
    }
  };
  const proposal = query.data?.proposals.find((item) => item.id === proposalId);
  const labels = {
    pending: "응답 대기",
    accepted: "약속 확정",
    rejected: "거절됨",
    withdrawn: "철회됨",
    superseded: "새 조건으로 변경됨",
  };
  return (
    <div className="text-body-14 text-black-900 border-black-200 w-72 max-w-[80%] rounded-xl border bg-white p-4">
      {proposal ? (
        <>
          <p className="text-label-14">
            {proposal.terms.kind === "sale" ? "구매 제안" : "교환 제안"} ·{" "}
            {labels[proposal.status]}
          </p>
          <p className="mt-2">
            {proposal.terms.method === "direct" ? "직거래" : "택배"} ·{" "}
            {new Date(proposal.terms.scheduledAt).toLocaleDateString("ko-KR")}
          </p>
          <button
            type="button"
            className="bg-black-50 mt-3 w-full rounded-lg p-3"
            onClick={() => setIsOpen(true)}
          >
            제안 확인하기
          </button>
          {isOpen && (
            <ChatActionDialog
              title={labels[proposal.status]}
              isPending={isPending}
              onClose={() => setIsOpen(false)}
            >
              <TradeProposalDetails proposal={proposal} userId={userId} />
              {error && (
                <p role="alert" className="mb-3">
                  {error}
                </p>
              )}
              {proposal.status === "pending" && (
                <div className="mb-3 flex gap-2">
                  {proposal.senderId === userId ? (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => void handleRespond("withdrawn")}
                      className="flex-1 rounded-lg border p-3 disabled:opacity-50"
                    >
                      제안 철회
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => void handleRespond("rejected")}
                        className="flex-1 rounded-lg border p-3 disabled:opacity-50"
                      >
                        거절
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => void handleRespond("accepted")}
                        className="bg-brand-blue flex-1 rounded-lg p-3 text-white disabled:opacity-50"
                      >
                        수락
                      </button>
                    </>
                  )}
                </div>
              )}
              <button
                type="button"
                disabled={isPending}
                className="w-full rounded-lg border p-3"
                onClick={() => setIsOpen(false)}
              >
                닫기
              </button>
            </ChatActionDialog>
          )}
        </>
      ) : (
        <>
          <p role={query.isError ? "alert" : "status"}>
            {query.isError
              ? "제안을 불러오지 못했습니다."
              : "제안을 불러오고 있습니다."}
          </p>
          {query.isError && (
            <button type="button" onClick={() => void query.refetch()}>
              다시 시도
            </button>
          )}
        </>
      )}
    </div>
  );
}
