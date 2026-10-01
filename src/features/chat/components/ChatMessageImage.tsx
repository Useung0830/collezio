"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { getBlob, getMetadata, ref } from "firebase/storage";

import Button from "@/components/common/button/Button";
import ChatImageViewer from "@/features/chat/components/ChatImageViewer";
import { getChatImageRows } from "@/features/chat/utils/getChatImageRows";
import { MAX_CHAT_IMAGE_BYTES } from "@/features/chat/utils/validateChatImage";

import { firebaseStorage } from "@/lib/firebase";
import { validateFirebaseUser } from "@/lib/validateFirebaseUser";

interface ChatMessageImageProps {
  paths: string[];
  userId: string;
}

export default function ChatMessageImage({
  paths,
  userId,
}: ChatMessageImageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const query = useQuery({
    queryKey: ["chat", "images", userId, paths],
    queryFn: () =>
      Promise.all(
        paths.map(async (path, index) => {
          validateFirebaseUser(userId);
          const reference = ref(firebaseStorage, path);
          const [blob, metadata] = await Promise.all([
            getBlob(reference, MAX_CHAT_IMAGE_BYTES),
            getMetadata(reference),
          ]);
          validateFirebaseUser(userId);
          const type = metadata.contentType ?? "image/jpeg";
          const extension =
            type === "image/png"
              ? "png"
              : type === "image/webp"
                ? "webp"
                : "jpg";
          const file = new File(
            [blob],
            `chat-photo-${index + 1}.${extension}`,
            { type },
          );
          const url = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () =>
              reject(new Error("이미지를 읽을 수 없습니다."));
            reader.onload = () =>
              typeof reader.result === "string"
                ? resolve(reader.result)
                : reject(new Error("이미지를 읽을 수 없습니다."));
            reader.readAsDataURL(file);
          });
          return { url, file };
        }),
      ),
    gcTime: 0,
    staleTime: Infinity,
    retry: false,
  });
  const rows = getChatImageRows(paths.length);
  return (
    <div className="text-body-14 text-black-900 w-60 max-w-[70%] overflow-hidden rounded-xl bg-white">
      {query.data ? (
        <>
          <button
            type="button"
            aria-label={`사진 ${paths.length}장 상세 보기`}
            onClick={() => setIsOpen(true)}
            className={`flex w-full flex-col gap-0.5 ${paths.length >= 7 ? "aspect-[3/4]" : "aspect-square"}`}
          >
            {rows.map((count, rowIndex) => {
              const start = rows
                .slice(0, rowIndex)
                .reduce((sum, value) => sum + value, 0);
              return (
                <span key={rowIndex} className="flex min-h-0 flex-1 gap-0.5">
                  {query.data
                    .slice(start, start + count)
                    .map((image, index) => (
                      <span
                        key={paths[start + index]}
                        className="relative min-w-0 flex-1 overflow-hidden"
                      >
                        <Image
                          src={image.url}
                          alt={
                            paths.length === 1
                              ? "채팅 이미지"
                              : `채팅 이미지 ${start + index + 1}`
                          }
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </span>
                    ))}
                </span>
              );
            })}
          </button>
          {isOpen && (
            <ChatImageViewer
              images={query.data}
              onClose={() => setIsOpen(false)}
            />
          )}
        </>
      ) : (
        <div
          className={`flex flex-col items-center justify-center gap-2 p-3 ${paths.length >= 7 ? "aspect-[3/4]" : "aspect-square"}`}
        >
          <p role={query.isError ? "alert" : "status"}>
            {query.isError
              ? "이미지를 불러오지 못했습니다."
              : "이미지를 불러오고 있습니다."}
          </p>
          {query.isError && (
            <Button onClick={() => void query.refetch()}>
              이미지 다시 불러오기
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
