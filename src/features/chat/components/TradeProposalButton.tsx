"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { createTradeProposal } from "@/features/chat/api/createTradeProposal";
import TradeProductPicker from "@/features/chat/components/TradeProductPicker";
import TradeProposalForm from "@/features/chat/components/TradeProposalForm";
import { useTradeCompletion } from "@/features/chat/hooks/useTradeCompletion";
import { useTradeProposals } from "@/features/chat/hooks/useTradeProposals";
import type { ChatRoomView } from "@/features/chat/types/registeredChatRoom";
import type { TradeTerms } from "@/features/chat/types/tradeProposal";
import { getRegisteredProduct } from "@/features/products/api/getRegisteredProduct";

export default function TradeProposalButton({
  room,
  userId,
}: {
  room: ChatRoomView;
  userId: string;
}) {
  const query = useTradeProposals(room.id, userId);
  const client = useQueryClient();
  const [initial, setInitial] = useState<TradeTerms | null>(null);
  const openedProposalId = useRef<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const previous = useRef<{ id: string; content: string } | null>(null);
  const accepted = query.data?.proposals.find(
    (item) => item.id === query.data?.state.acceptedId,
  );
  const pending = !!query.data?.state.pendingId;
  const completion = useTradeCompletion(room.id, userId, accepted?.id ?? null);
  const isCompleted = completion.data?.confirmedBy.length === 2;
  const handleOpen = async () => {
    setError("");
    setIsLoading(true);
    try {
      const product = await getRegisteredProduct(room.productId, userId);
      if (!product) throw new Error("상품을 찾을 수 없습니다.");
      openedProposalId.current = accepted?.id ?? null;
      setInitial(
        accepted?.terms ?? {
          kind: product.transaction.type,
          amount:
            product.transaction.type === "sale" ? product.transaction.price : 0,
          exchangeProductId: null,
          extraAmount: 0,
          extraPayer: "none",
          method: product.delivery.type,
          scheduledAt: 0,
          location:
            product.delivery.type === "direct" ? product.delivery.location : "",
          shippingPayer: "requester",
          notes: "",
        },
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "상품을 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleSubmit = async (terms: TradeTerms) => {
    const content = JSON.stringify(terms);
    const id =
      previous.current?.content === content
        ? previous.current.id
        : crypto.randomUUID();
    previous.current = { id, content };
    await createTradeProposal(
      room.id,
      userId,
      id,
      terms,
      openedProposalId.current,
    );
    await client.invalidateQueries({ queryKey: ["chat"] });
    previous.current = null;
  };
  return (
    <div className="text-caption-12 shrink-0">
      <button
        type="button"
        disabled={
          query.isPending ||
          query.isError ||
          isLoading ||
          pending ||
          isCompleted ||
          (!!accepted && (completion.isPending || completion.isError)) ||
          (!accepted && userId !== room.requesterId)
        }
        onClick={() => void handleOpen()}
        className="bg-brand-blue rounded-full px-3 py-2 text-white disabled:opacity-50"
      >
        {isCompleted
          ? "거래 완료"
          : pending
            ? "제안 응답 대기"
            : accepted
              ? "조건 변경"
              : room.transaction?.type === "sale"
                ? "구매 제안"
                : "교환 제안"}
      </button>
      {query.isError && (
        <button type="button" onClick={() => void query.refetch()}>
          다시 확인
        </button>
      )}
      {error && <p role="alert">{error}</p>}
      {initial && (
        <TradeProposalForm
          initial={initial}
          draftKey={`trade-draft:${userId}:${room.id}:${accepted?.id ?? "new"}`}
          onClose={() => setInitial(null)}
          onSubmit={handleSubmit}
          renderProducts={(selected, onSelect) =>
            userId === room.requesterId ? (
              <TradeProductPicker
                userId={userId}
                selected={selected}
                reservedProductId={accepted?.terms.exchangeProductId}
                onSelect={onSelect}
              />
            ) : (
              <p>교환 상품 변경은 교환 신청자가 제안할 수 있습니다.</p>
            )
          }
        />
      )}
    </div>
  );
}
