"use client";

import Button from "@/components/common/button/Button";
import LinkButton from "@/components/common/button/LinkButton";
import ChatRoomCard from "@/features/chat/components/ChatRoomCard";
import { useChatRoomsQuery } from "@/features/chat/hooks/useChatRoomsQuery";

export default function ChatRoomList() {
  const query = useChatRoomsQuery();
  if (query.isAuthLoading)
    return (
      <p role="status" className="text-body-16 text-black-900 mt-5">
        로그인 상태를 확인하고 있습니다.
      </p>
    );
  if (!query.userId)
    return (
      <div className="text-body-16 text-black-900 mt-5 flex flex-col items-start gap-3">
        <p>로그인 후 채팅 목록을 확인할 수 있습니다.</p>
        <LinkButton href="/login">로그인</LinkButton>
      </div>
    );
  if (query.isPending)
    return (
      <p role="status" className="text-body-16 text-black-900 mt-5">
        {query.isPaused
          ? "인터넷 연결을 확인해주세요."
          : "채팅 목록을 불러오고 있습니다."}
      </p>
    );
  if (query.isError)
    return (
      <div className="text-body-16 text-black-900 mt-5 flex flex-col items-start gap-3">
        <p role="alert">채팅 목록을 불러오지 못했습니다.</p>
        <Button
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          다시 시도
        </Button>
      </div>
    );
  if (!query.data.length)
    return (
      <p
        role="status"
        className="text-body-16 text-black-900 py-10 text-center"
      >
        아직 채팅방이 없습니다.
      </p>
    );
  return (
    <ul className="mt-5 flex flex-col gap-1">
      {query.data.map((room) => (
        <ChatRoomCard key={room.id} chatRoom={room} />
      ))}
    </ul>
  );
}
