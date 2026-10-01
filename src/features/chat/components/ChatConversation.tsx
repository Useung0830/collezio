"use client";

import Button from "@/components/common/button/Button";
import ChatBlockNotice from "@/features/chat/components/ChatBlockNotice";
import ChatMessageComposer from "@/features/chat/components/ChatMessageComposer";
import ChatMessageList from "@/features/chat/components/ChatMessageList";
import { useChatMessagesQuery } from "@/features/chat/hooks/useChatMessagesQuery";

interface ChatConversationProps {
  roomId: string;
  userId: string;
  partnerId: string;
}

export default function ChatConversation({
  roomId,
  userId,
  partnerId,
}: ChatConversationProps) {
  const query = useChatMessagesQuery(roomId, userId);
  return (
    <section
      aria-label="채팅 대화"
      className="bg-black-50 flex min-h-0 flex-1 flex-col gap-6 pt-7 pb-[34px]"
    >
      {query.isPending ? (
        <p role="status" className="text-body-14 text-black-900 flex-1 px-3">
          메시지를 불러오고 있습니다.
        </p>
      ) : query.isError ? (
        <div className="text-body-14 text-black-900 flex flex-1 flex-col items-start gap-3 px-3">
          <p role="alert">
            메시지를 불러오지 못했습니다. 연결 상태를 확인해주세요.
          </p>
          <Button
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            다시 시도
          </Button>
        </div>
      ) : query.data?.length ? (
        <ChatMessageList messages={query.data} userId={userId} />
      ) : (
        <div className="text-body-14 text-black-900 flex flex-1 flex-col items-center justify-center gap-2 px-3 text-center">
          <p>아직 시작하지 않은 대화입니다.</p>
          <p>첫 메시지를 보내면 상대방의 채팅 목록에도 표시됩니다.</p>
        </div>
      )}
      <div className="shrink-0 px-3 sm:px-4">
        <ChatBlockNotice roomId={roomId} userId={userId} partnerId={partnerId}>
          <ChatMessageComposer
            roomId={roomId}
            userId={userId}
            disabled={query.isPending || query.isError}
          />
        </ChatBlockNotice>
      </div>
    </section>
  );
}
