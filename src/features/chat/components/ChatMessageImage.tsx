"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { getBlob, ref } from "firebase/storage";

import Button from "@/components/common/button/Button";
import { MAX_CHAT_IMAGE_BYTES } from "@/features/chat/utils/validateChatImage";

import { firebaseStorage } from "@/lib/firebase";
import { validateFirebaseUser } from "@/lib/validateFirebaseUser";

interface ChatMessageImageProps {
  path: string;
  userId: string;
}

export default function ChatMessageImage({
  path,
  userId,
}: ChatMessageImageProps) {
  const query = useQuery({
    queryKey: ["chat", "image", userId, path],
    queryFn: async () => {
      validateFirebaseUser(userId);
      const blob = await getBlob(
        ref(firebaseStorage, path),
        MAX_CHAT_IMAGE_BYTES,
      );
      validateFirebaseUser(userId);
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("이미지를 읽을 수 없습니다."));
        reader.onload = () =>
          typeof reader.result === "string"
            ? resolve(reader.result)
            : reject(new Error("이미지를 읽을 수 없습니다."));
        reader.readAsDataURL(blob);
      });
    },
    gcTime: 0,
    staleTime: Infinity,
    retry: false,
  });
  return (
    <div className="text-body-14 text-black-900 w-60 max-w-[70%] overflow-hidden rounded-xl bg-white">
      {query.data ? (
        <Image
          src={query.data}
          alt="채팅 이미지"
          width={240}
          height={240}
          unoptimized
          className="h-auto max-h-80 w-full object-contain"
        />
      ) : (
        <div className="flex min-h-32 flex-col items-center justify-center gap-2 p-3">
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
