"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/common/button/Button";
import LinkButton from "@/components/common/button/LinkButton";
import { useChatUser } from "@/features/chat/hooks/useChatUser";
import { useCreateChatRoomMutation } from "@/features/chat/hooks/useCreateChatRoomMutation";
import type { ProductTransaction } from "@/features/products/types/product";

import { firebaseAuth } from "@/lib/firebase";

interface StartChatButtonProps {
  productId: string;
  sellerId: string | null;
  transactionType: ProductTransaction["type"];
}

export default function StartChatButton({
  productId,
  sellerId,
  transactionType,
}: StartChatButtonProps) {
  const router = useRouter();
  const { userId, isAuthLoading } = useChatUser();
  const mutation = useCreateChatRoomMutation();
  const [isLoginRequired, setIsLoginRequired] = useState(false);
  const isOwnProduct = Boolean(userId && userId === sellerId);

  const handleStartChat = () => {
    if (isAuthLoading || mutation.isPending || isOwnProduct || !sellerId)
      return;
    if (!userId) {
      setIsLoginRequired(true);
      return;
    }
    mutation.mutate(
      { productId, userId },
      {
        onSuccess: (roomId) => {
          if (firebaseAuth.currentUser?.uid === userId) {
            router.push(`/chat/${encodeURIComponent(roomId)}`);
          }
        },
      },
    );
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <Button
        variant={transactionType === "sale" ? "blue" : "green"}
        size="lg"
        shape="rounded"
        className="w-full whitespace-nowrap"
        disabled={isAuthLoading || isOwnProduct || !sellerId}
        isLoading={mutation.isPending}
        onClick={handleStartChat}
      >
        채팅하기
      </Button>
      {isOwnProduct && (
        <p className="text-body-14 text-black-900">
          내 상품에는 채팅을 시작할 수 없습니다.
        </p>
      )}
      {!sellerId && (
        <p className="text-body-14 text-black-900">
          판매자 정보를 확인할 수 없습니다.
        </p>
      )}
      {isLoginRequired && !userId && !isAuthLoading && (
        <div className="text-body-14 text-black-900 flex flex-wrap items-center gap-2">
          <p role="status">로그인 후 채팅을 시작할 수 있습니다.</p>
          <LinkButton href="/login" size="sm">
            로그인
          </LinkButton>
        </div>
      )}
      {mutation.isError && mutation.variables?.userId === userId && (
        <p role="alert" className="text-body-14 text-black-900">
          채팅방을 열지 못했습니다. 연결 상태를 확인하고 다시 눌러주세요.
        </p>
      )}
      {mutation.isPaused && (
        <p role="status" className="text-body-14 text-black-900">
          인터넷 연결을 기다리고 있습니다.
        </p>
      )}
    </div>
  );
}
