"use client";

import { useRef, useState } from "react";

import Button from "@/components/common/button/Button";
import { MAX_CHAT_MESSAGE_LENGTH } from "@/features/chat/constants/chat";
import { useSendChatMessageMutation } from "@/features/chat/hooks/useSendChatMessageMutation";
import type { SendChatMessageInput } from "@/features/chat/types/chatMessage";

interface ChatMessageComposerProps {
  roomId: string;
  userId: string;
  disabled: boolean;
}

export default function ChatMessageComposer({
  roomId,
  userId,
  disabled,
}: ChatMessageComposerProps) {
  const mutation = useSendChatMessageMutation();
  const [content, setContent] = useState("");
  const previousRequest = useRef<SendChatMessageInput | null>(null);

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = content.trim();
    if (
      !text ||
      text.length > MAX_CHAT_MESSAGE_LENGTH ||
      disabled ||
      mutation.isPending
    )
      return;
    const previous = previousRequest.current;
    const request =
      previous?.content === text
        ? previous
        : { roomId, userId, content: text, messageId: crypto.randomUUID() };
    previousRequest.current = request;
    mutation.mutate(request, {
      onSuccess: () => {
        setContent("");
        previousRequest.current = null;
      },
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing ||
      event.keyCode === 229
    )
      return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">메시지</span>
          <textarea
            aria-label="메시지"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={mutation.isPending || disabled}
            maxLength={MAX_CHAT_MESSAGE_LENGTH}
            rows={2}
            placeholder="메시지를 입력해 주세요"
            className="border-black-200 text-body-14 text-black-900 placeholder:text-black-400 w-full resize-none rounded-2xl border bg-white px-4 py-3 disabled:opacity-50"
          />
        </label>
        <Button
          type="submit"
          disabled={!content.trim() || disabled}
          isLoading={mutation.isPending}
          size="sm"
          aria-label="메시지 전송"
        >
          {mutation.isError ? "다시 보내기" : "전송"}
        </Button>
      </div>
      {mutation.isPaused && (
        <p role="status" className="text-body-14 text-black-900">
          인터넷 연결을 기다리고 있습니다. 연결되면 전송됩니다.
        </p>
      )}
      {mutation.isError && (
        <p role="alert" className="text-body-14 text-black-900">
          메시지를 보내지 못했습니다. 내용을 확인하고 다시 보내주세요.
        </p>
      )}
    </form>
  );
}
