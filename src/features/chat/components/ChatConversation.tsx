"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import type { ChatMessage } from "@/features/chat/types/chatRoom";

import ArrowRightIcon from "@/assets/icons/icon-arrow-right.svg";
import CloseIcon from "@/assets/icons/icon-close.svg";
import GalleryIcon from "@/assets/icons/icon-gallery.svg";

type ChatConversationProps = {
  chatRoomId: number;
  initialMessages: ChatMessage[];
};

type PendingImage = {
  name: string;
  url: string;
};

export default function ChatConversation({
  chatRoomId,
  initialMessages,
}: ChatConversationProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [message, setMessage] = useState("");
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);

  const imageUrls = useRef(new Set<string>());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const uploadedImageUrls = imageUrls.current;

    return () => {
      uploadedImageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (pendingImage) {
      URL.revokeObjectURL(pendingImage.url);
      imageUrls.current.delete(pendingImage.url);
    }

    const url = URL.createObjectURL(file);
    imageUrls.current.add(url);
    setPendingImage({ name: file.name, url });
    event.target.value = "";
  };

  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };

  const handleImageRemove = () => {
    if (!pendingImage) {
      return;
    }

    URL.revokeObjectURL(pendingImage.url);
    imageUrls.current.delete(pendingImage.url);
    setPendingImage(null);
  };

  const handleMessageSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage && !pendingImage) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now(),
        chatRoomId,
        content: trimmedMessage,
        imageUrl: pendingImage?.url,
        sentAt: "방금 전",
        sender: "me",
        isRead: false,
      },
    ]);
    setMessage("");
    setPendingImage(null);
  };

  return (
    <section className="bg-black-50 flex min-h-0 flex-1 flex-col px-3 py-5">
      <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-6">
        <p className="text-caption-12 text-black-600 text-center">
          2026년 08월 17일
        </p>
        <ul className="mt-5 flex flex-col gap-4">
          {messages.map((item) => {
            const isMine = item.sender === "me";

            return (
              <li
                key={item.id}
                className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
              >
                {isMine && (
                  <span className="text-caption-12 text-black-600 text-right">
                    {item.isRead && <span className="block">읽음</span>}
                    {item.sentAt}
                  </span>
                )}
                <div
                  className={`text-body-14 flex max-w-[70%] flex-col gap-2 overflow-hidden rounded-2xl ${
                    isMine
                      ? "bg-black-600 text-white"
                      : "text-black-900 bg-white"
                  }`}
                >
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt="채팅 첨부 이미지"
                      width={240}
                      height={240}
                      unoptimized
                      className="max-h-60 w-full object-cover"
                    />
                  )}
                  {item.content && <p className="px-4 py-3">{item.content}</p>}
                </div>
                {!isMine && (
                  <span className="text-caption-12 text-black-600">
                    {item.isRead && <span className="block">읽음</span>}
                    {item.sentAt}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <div ref={messageEndRef} />
      </div>

      <form className="flex flex-col gap-2" onSubmit={handleMessageSubmit}>
        {pendingImage && (
          <div className="relative ml-11 size-20">
            <Image
              src={pendingImage.url}
              alt={pendingImage.name}
              fill
              unoptimized
              sizes="80px"
              className="rounded-xl object-cover"
            />
            <button
              type="button"
              className="border-black-200 text-black-900 absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full border bg-white"
              aria-label="선택한 사진 삭제"
              onClick={handleImageRemove}
            >
              <CloseIcon className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-black-500 flex size-9 shrink-0 cursor-pointer items-center justify-center"
            aria-label="사진 첨부"
            onClick={handleImageSelect}
          >
            <GalleryIcon className="size-5" aria-hidden="true" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            onChange={handleImageUpload}
          />
          <label className="border-black-200 flex min-w-0 flex-1 items-center rounded-full border bg-white px-4 py-2">
            <span className="sr-only">메시지</span>
            <input
              value={message}
              placeholder="메시지를 입력해 주세요"
              className="text-body-14 text-black-900 placeholder:text-black-400 min-w-0 flex-1 outline-none"
              onChange={handleMessageChange}
            />
            <button
              type="submit"
              disabled={!message.trim() && !pendingImage}
              className="bg-black-400 flex size-7 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-50"
              aria-label="메시지 전송"
            >
              <ArrowRightIcon
                className="size-3.5 -rotate-90"
                aria-hidden="true"
              />
            </button>
          </label>
        </div>
      </form>
    </section>
  );
}
