"use client";

import { useState } from "react";

import ChatReportDialog from "@/features/chat/components/ChatReportDialog";
import type { ChatParticipantInput } from "@/features/chat/types/chatModeration";

import BlockIcon from "@/assets/icons/icon-block.svg";
import SirenIcon from "@/assets/icons/icon-siren.svg";

export default function ChatRoomActions(props: ChatParticipantInput) {
  const [isReportOpen, setIsReportOpen] = useState(false);
  return (
    <>
      <div
        role="group"
        aria-label="채팅 관리"
        className="flex items-center justify-center gap-3"
      >
        <button
          type="button"
          onClick={() => setIsReportOpen(true)}
          className="flex items-center gap-1 rounded focus-visible:outline-2"
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
      {isReportOpen && (
        <ChatReportDialog {...props} onClose={() => setIsReportOpen(false)} />
      )}
    </>
  );
}
