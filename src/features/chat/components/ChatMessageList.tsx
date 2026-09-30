"use client";

import { useEffect, useRef } from "react";

import type { ChatMessage } from "@/features/chat/types/chatMessage";

interface ChatMessageListProps {
  messages: ChatMessage[];
  userId: string;
}

export default function ChatMessageList({
  messages,
  userId,
}: ChatMessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const lastMessageId = messages.at(-1)?.id;
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [lastMessageId]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <ul aria-label="대화 메시지" className="flex flex-col gap-4">
        {messages.map((message, index) => {
          const isMine = message.senderId === userId;
          const sentAt = new Date(message.createdAt);
          const date = sentAt.toLocaleDateString("ko-KR");
          const previousDate =
            index > 0
              ? new Date(messages[index - 1].createdAt).toLocaleDateString(
                  "ko-KR",
                )
              : null;
          return (
            <li key={message.id}>
              {date !== previousDate && (
                <p className="text-caption-12 text-black-600 mb-4 text-center">
                  {date}
                </p>
              )}
              <div
                aria-label={isMine ? "내 메시지" : "상대방 메시지"}
                className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}
              >
                <p
                  className={`text-body-14 max-w-[75%] rounded-2xl px-4 py-3 wrap-anywhere whitespace-pre-wrap ${isMine ? "bg-black-600 text-white" : "text-black-900 bg-white"}`}
                >
                  {message.content}
                </p>
                <time
                  dateTime={message.createdAt}
                  className="text-caption-12 text-black-600 shrink-0"
                >
                  {sentAt.toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
            </li>
          );
        })}
      </ul>
      <div ref={endRef} />
    </div>
  );
}
