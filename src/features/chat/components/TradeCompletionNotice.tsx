"use client";

import { useEffect, useState } from "react";

import TradeCompletionCard from "@/features/chat/components/TradeCompletionCard";
import { useTradeProposals } from "@/features/chat/hooks/useTradeProposals";

interface TradeCompletionNoticeProps {
  roomId: string;
  userId: string;
  requesterId: string;
}

export default function TradeCompletionNotice({
  roomId,
  userId,
  requesterId,
}: TradeCompletionNoticeProps) {
  const query = useTradeProposals(roomId, userId);
  const [now, setNow] = useState(0);
  const proposal = query.data?.proposals.find(
    (item) =>
      item.id === query.data.state.acceptedId && item.status === "accepted",
  );
  useEffect(() => {
    const update = () => setNow(Date.now());
    const timer = window.setInterval(update, 1000);
    const initial = window.setTimeout(update, 0);
    window.addEventListener("focus", update);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(initial);
      window.removeEventListener("focus", update);
    };
  }, []);
  if (!proposal || proposal.terms.scheduledAt > now) return null;
  return (
    <TradeCompletionCard
      key={proposal.id}
      roomId={roomId}
      userId={userId}
      requesterId={requesterId}
      proposal={proposal}
      hasPendingProposal={!!query.data?.state.pendingId}
    />
  );
}
