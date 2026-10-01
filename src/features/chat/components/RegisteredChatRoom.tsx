"use client";

import Button from "@/components/common/button/Button";
import LinkButton from "@/components/common/button/LinkButton";
import ChatConversation from "@/features/chat/components/ChatConversation";
import ChatProductSummary from "@/features/chat/components/ChatProductSummary";
import ChatRoomHeader from "@/features/chat/components/ChatRoomHeader";
import { useChatRoomQuery } from "@/features/chat/hooks/useChatRoomQuery";

interface RegisteredChatRoomProps {
  roomId: string;
}

export default function RegisteredChatRoom({
  roomId,
}: RegisteredChatRoomProps) {
  const query = useChatRoomQuery(roomId);
  if (query.isAuthLoading)
    return (
      <p role="status" className="text-body-16 text-black-900">
        로그인 상태를 확인하고 있습니다.
      </p>
    );
  if (!query.userId)
    return (
      <div className="text-body-16 text-black-900 flex flex-col items-start gap-3">
        <p>로그인 후 채팅방을 확인할 수 있습니다.</p>
        <LinkButton href="/login">로그인</LinkButton>
      </div>
    );
  if (query.isPending)
    return (
      <p role="status" className="text-body-16 text-black-900">
        {query.isPaused
          ? "인터넷 연결을 확인해주세요."
          : "채팅방을 불러오고 있습니다."}
      </p>
    );
  if (query.isError || !query.data)
    return (
      <div className="text-body-16 text-black-900 flex flex-col items-start gap-3">
        <p role="alert">
          채팅방을 열 수 없습니다. 로그인 계정과 접근 권한을 확인해주세요.
        </p>
        <Button
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          다시 시도
        </Button>
        <LinkButton href="/chat">채팅 목록으로</LinkButton>
      </div>
    );
  return (
    <div className="text-black-900 mx-auto flex h-[calc(100dvh-7rem)] min-h-100 w-full max-w-156 flex-col overflow-hidden bg-white">
      <ChatRoomHeader
        key={`${roomId}:${query.userId}`}
        chatRoom={query.data}
        userId={query.userId}
      />
      <ChatProductSummary chatRoom={query.data} />
      <ChatConversation
        key={`${roomId}:${query.userId}`}
        roomId={roomId}
        userId={query.userId}
      />
    </div>
  );
}
