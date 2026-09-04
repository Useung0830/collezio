"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import type { ChatRoom } from "@/features/chat/types/chatRoom";

import KebabIcon from "@/assets/icons/icon-kebab.svg";
import RightIcon from "@/assets/icons/icon-right.svg";

type ChatRoomHeaderProps = {
  chatRoom: ChatRoom;
};

export default function ChatRoomHeader({ chatRoom }: ChatRoomHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <header className="relative flex h-14 items-center justify-between px-4">
      <button
        type="button"
        aria-label="채팅 목록으로 돌아가기"
        onClick={handleBack}
      >
        <RightIcon className="size-5 rotate-180" aria-hidden="true" />
      </button>

      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
        <Image
          src={chatRoom.partnerImage}
          alt={`${chatRoom.partnerName} 프로필`}
          width={28}
          height={28}
          className="size-7 rounded-full object-cover"
        />
        <h1 className="text-label-16 text-black-900 whitespace-nowrap">
          {chatRoom.partnerName}
        </h1>
      </div>

      <button type="button" aria-label="채팅방 메뉴">
        <KebabIcon className="size-6" aria-hidden="true" />
      </button>
    </header>
  );
}
