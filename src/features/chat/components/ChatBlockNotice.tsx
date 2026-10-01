"use client";

import { useState } from "react";

import Button from "@/components/common/button/Button";
import ChatBlockDialog from "@/features/chat/components/ChatBlockDialog";
import { useChatBlockStatus } from "@/features/chat/hooks/useChatBlockStatus";
import type { ChatParticipantInput } from "@/features/chat/types/chatModeration";

type ChatBlockNoticeProps = ChatParticipantInput & {
  children: React.ReactNode;
};

export default function ChatBlockNotice({
  children,
  ...input
}: ChatBlockNoticeProps) {
  const query = useChatBlockStatus(input.userId, input.partnerId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  if (query.isError)
    return (
      <div className="text-body-14 flex flex-col items-center gap-2">
        <p role="alert">대화 가능 여부를 확인하지 못했습니다.</p>
        <Button
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
        >
          다시 확인
        </Button>
      </div>
    );
  if (query.isPending)
    return (
      <p role="status" className="text-body-14 text-center">
        대화 가능 여부를 확인하고 있습니다.
      </p>
    );
  if (!query.isBlocked) return children;
  return (
    <div className="text-body-14 flex shrink-0 flex-col items-center gap-2 py-2 text-center">
      <p role="status">
        {query.data?.isBlockedByMe
          ? "차단한 사용자입니다. 기존 대화는 계속 확인할 수 있습니다."
          : "메시지를 보낼 수 없는 대화입니다."}
      </p>
      {query.data?.isBlockedByMe && (
        <Button onClick={() => setIsDialogOpen(true)}>차단 해제</Button>
      )}
      {isDialogOpen && (
        <ChatBlockDialog
          {...input}
          isBlocked
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </div>
  );
}
