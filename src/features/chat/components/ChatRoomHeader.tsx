"use client";

import { useId, useState } from "react";
import Link from "next/link";

import type { ChatRoomView } from "@/features/chat/types/registeredChatRoom";
import ProfileAvatar from "@/features/user/components/ProfileAvatar";

import BlockIcon from "@/assets/icons/icon-block.svg";
import KebabIcon from "@/assets/icons/icon-kebab.svg";
import RightIcon from "@/assets/icons/icon-right.svg";
import SirenIcon from "@/assets/icons/icon-siren.svg";

type ChatRoomHeaderProps = { chatRoom: ChatRoomView };

export default function ChatRoomHeader({ chatRoom }: ChatRoomHeaderProps) {
  const actionsId = useId();
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  const handleToggleActions = () => {
    setIsActionsOpen((isOpen) => !isOpen);
  };

  return (
    <>
      <header className="text-black-900 grid h-16 shrink-0 grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 px-3">
        <Link
          href="/chat"
          replace
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
          aria-label="채팅 더보기"
          aria-expanded={isActionsOpen}
          aria-controls={actionsId}
          onClick={handleToggleActions}
          className="hover:bg-black-50 flex size-10 items-center justify-center rounded-full focus-visible:outline-2"
        >
          <KebabIcon className="size-5" aria-hidden="true" />
        </button>
      </header>
      <div
        id={actionsId}
        hidden={!isActionsOpen}
        className="text-body-14 text-black-900 shrink-0 pb-3"
      >
        <div
          role="group"
          aria-label="채팅 관리"
          className="flex items-center justify-center gap-3"
        >
          <button
            type="button"
            disabled
            title="신고 기능 준비 중"
            className="flex items-center gap-1 disabled:cursor-not-allowed"
          >
            <SirenIcon className="size-4" aria-hidden="true" />
            신고하기
          </button>
          <button
            type="button"
            disabled
            title="차단 기능 준비 중"
            className="flex items-center gap-1 disabled:cursor-not-allowed"
          >
            <BlockIcon className="size-4" aria-hidden="true" />
            차단하기
          </button>
        </div>
      </div>
    </>
  );
}
