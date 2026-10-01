"use client";

import { useEffect, useRef } from "react";

import ChatMessageImage from "@/features/chat/components/ChatMessageImage";
import type { ChatMessage } from "@/features/chat/types/chatMessage";

import styles from "./ChatMessageList.module.css";

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
    <div className={`${styles.scrollArea} min-h-0 flex-1 overflow-y-auto`}>
      <ul aria-label="대화 메시지" className="flex flex-col gap-3 px-3 pb-2">
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
                <p className="text-caption-12 text-black-900 mt-1 mb-6 text-center">
                  {sentAt.toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
              <div
                aria-label={isMine ? "내 메시지" : "상대방 메시지"}
                className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}
              >
                {message.imagePaths || message.imagePath ? (
                  <ChatMessageImage
                    paths={
                      message.imagePaths ??
                      (message.imagePath ? [message.imagePath] : [])
                    }
                    userId={userId}
                  />
                ) : (
                  <p
                    className={`text-body-14 max-w-[75%] min-w-0 rounded-xl px-3 py-2.5 wrap-anywhere whitespace-pre-wrap ${isMine ? "bg-black-600 rounded-tr-none text-white" : "text-black-900 rounded-tl-none bg-white"}`}
                  >
                    {message.content}
                  </p>
                )}
                <time
                  dateTime={message.createdAt}
                  className={`text-caption-12 text-black-900 shrink-0 pb-0.5 ${isMine ? "text-right" : "text-left"}`}
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
