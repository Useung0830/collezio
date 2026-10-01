import Link from "next/link";

import type { ChatRoomView } from "@/features/chat/types/registeredChatRoom";
import ProfileAvatar from "@/features/user/components/ProfileAvatar";

import KebabIcon from "@/assets/icons/icon-kebab.svg";
import RightIcon from "@/assets/icons/icon-right.svg";

type ChatRoomHeaderProps = { chatRoom: ChatRoomView };

export default function ChatRoomHeader({ chatRoom }: ChatRoomHeaderProps) {
  return (
    <header className="text-black-900 grid h-16 shrink-0 grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 px-3">
      <Link
        href="/chat"
        aria-label="채팅 목록으로 돌아가기"
        className="hover:bg-black-50 flex size-10 items-center justify-center rounded-full focus-visible:outline-2"
      >
        <RightIcon className="size-5 rotate-180" aria-hidden="true" />
      </Link>
      <div className="flex min-w-0 items-center justify-center gap-2">
        <ProfileAvatar
          imageUrl={chatRoom.partnerImageUrl}
          nickname={chatRoom.partnerName}
          size="sm"
        />
        <h1 className="text-label-14 text-black-900 min-w-0 truncate">
          {chatRoom.partnerName}
        </h1>
      </div>
      <button
        type="button"
        disabled
        aria-label="채팅 더보기 (준비 중)"
        title="채팅 더보기 기능 준비 중"
        className="flex size-10 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-40"
      >
        <KebabIcon className="size-5" aria-hidden="true" />
      </button>
    </header>
  );
}
