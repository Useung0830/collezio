import Link from "next/link";

import type { ChatRoomView } from "@/features/chat/types/registeredChatRoom";
import ProfileAvatar from "@/features/user/components/ProfileAvatar";

import RightIcon from "@/assets/icons/icon-right.svg";

type ChatRoomHeaderProps = { chatRoom: ChatRoomView };

export default function ChatRoomHeader({ chatRoom }: ChatRoomHeaderProps) {
  return (
    <header className="flex min-h-20 items-center gap-3 px-4 py-2">
      <Link href="/chat" aria-label="채팅 목록으로 돌아가기">
        <RightIcon className="size-5 rotate-180" aria-hidden="true" />
      </Link>
      <ProfileAvatar
        imageUrl={chatRoom.partnerImageUrl}
        nickname={chatRoom.partnerName}
      />
      <h1 className="text-label-16 text-black-900 min-w-0 truncate">
        {chatRoom.partnerName}
      </h1>
    </header>
  );
}
