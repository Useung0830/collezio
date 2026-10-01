"use client";

import { useEffect, useRef, useState } from "react";

import ChatImagePreview from "@/features/chat/components/ChatImagePreview";
import { MAX_CHAT_MESSAGE_LENGTH } from "@/features/chat/constants/chat";
import { useSendChatMessageMutation } from "@/features/chat/hooks/useSendChatMessageMutation";
import type { SendChatMessageInput } from "@/features/chat/types/chatMessage";
import {
  CHAT_IMAGE_TYPES,
  MAX_CHAT_IMAGES,
  validateChatImage,
} from "@/features/chat/utils/validateChatImage";

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
  const [attachments, setAttachments] = useState<
    {
      file: File;
      url: string;
    }[]
  >([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const previewUrls = useRef<string[]>([]);
  const previousRequest = useRef<SendChatMessageInput | null>(null);
  const isSubmitting = useRef(false);

  const clearAttachment = () => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrls.current = [];
    setAttachments([]);
    setImageError(null);
  };
  const handleSelectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length || disabled || mutation.isPending) return;
    try {
      if (attachments.length + files.length > MAX_CHAT_IMAGES)
        throw new Error("사진은 최대 10장까지 선택할 수 있습니다.");
      files.forEach(validateChatImage);
      const selected = files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));
      previewUrls.current.push(...selected.map(({ url }) => url));
      setAttachments([...attachments, ...selected]);
      setImageError(null);
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : "이미지를 확인해주세요.",
      );
    }
  };
  useEffect(
    () => () => {
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = content.trim();
    if (
      (!text && !attachments.length) ||
      text.length > MAX_CHAT_MESSAGE_LENGTH ||
      disabled ||
      mutation.isPending ||
      isSubmitting.current
    )
      return;
    const previous = previousRequest.current;
    const request =
      previous?.content === text &&
      previous.images?.length === attachments.length &&
      previous.images.every((file, index) => file === attachments[index].file)
        ? previous
        : {
            roomId,
            userId,
            content: text,
            messageId: crypto.randomUUID(),
            images: attachments.map(({ file }) => file),
          };
    previousRequest.current = request;
    isSubmitting.current = true;
    mutation.mutate(request, {
      onSuccess: () => {
        setContent("");
        clearAttachment();
        previousRequest.current = null;
      },
      onSettled: () => {
        isSubmitting.current = false;
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
    <form
      onSubmit={handleSubmit}
      className="flex shrink-0 flex-col gap-2 pb-[env(safe-area-inset-bottom)]"
    >
      <input
        ref={fileInput}
        type="file"
        multiple
        accept={CHAT_IMAGE_TYPES.join(",")}
        aria-label="채팅 이미지 선택"
        className="sr-only"
        tabIndex={-1}
        disabled={disabled || mutation.isPending}
        onChange={handleSelectImage}
      />
      {attachments.length > 0 && (
        <div
          className="ml-11 flex gap-2 overflow-x-auto"
          aria-label="첨부 이미지 목록"
        >
          {attachments.map((attachment, index) => (
            <ChatImagePreview
              key={attachment.url}
              url={attachment.url}
              disabled={disabled || mutation.isPending}
              onRemove={() => {
                URL.revokeObjectURL(attachment.url);
                previewUrls.current = previewUrls.current.filter(
                  (url) => url !== attachment.url,
                );
                setAttachments(
                  attachments.filter(
                    (_, selectedIndex) => selectedIndex !== index,
                  ),
                );
                setImageError(null);
              }}
            />
          ))}
        </div>
      )}
      {imageError && (
        <p role="alert" className="text-body-14 text-black-900">
          {imageError}
        </p>
      )}
      <div className="flex items-end gap-2">
        <button
          type="button"
          disabled={disabled || mutation.isPending}
          onClick={() => fileInput.current?.click()}
          aria-label="사진 첨부"
          title="사진 첨부"
          className="text-black-400 mb-1 flex size-9 shrink-0 items-center justify-center disabled:cursor-not-allowed"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-5"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 4 6.5 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2.5L16 4H8Zm4 5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />
          </svg>
        </button>
        <div className="border-black-200 focus-within:ring-black-400 flex min-w-0 flex-1 items-end gap-2 rounded-3xl border bg-white px-3 py-1.5 focus-within:ring-1">
          <label className="flex min-w-0 flex-1">
            <span className="sr-only">메시지</span>
            <textarea
              aria-label="메시지"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={mutation.isPending || disabled}
              maxLength={MAX_CHAT_MESSAGE_LENGTH}
              rows={1}
              placeholder="메시지를 입력해 주세요"
              className="text-body-14 text-black-900 placeholder:text-black-400 [field-sizing:content] max-h-28 min-h-5 w-full resize-none [scrollbar-width:none] overflow-y-auto bg-transparent py-1 outline-none disabled:opacity-50 [&::-webkit-scrollbar]:hidden"
            />
          </label>
          <button
            type="submit"
            disabled={
              (!content.trim() && !attachments.length) ||
              disabled ||
              mutation.isPending
            }
            aria-busy={mutation.isPending}
            title={mutation.isError ? "다시 보내기" : "메시지 전송"}
            className="bg-black-600 hover:bg-black-900 focus-visible:outline-black-900 disabled:bg-black-300 mb-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed"
            aria-label="메시지 전송"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m6 11 6-6 6 6M12 5v14" />
            </svg>
          </button>
        </div>
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
