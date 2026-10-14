"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/common/button/Button";
import LinkButton from "@/components/common/button/LinkButton";
import { useChatBlockStatus } from "@/features/chat/hooks/useChatBlockStatus";
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
  const block = useChatBlockStatus(userId, sellerId);
  const mutation = useCreateChatRoomMutation();
  const [isLoginRequired, setIsLoginRequired] = useState(false);
  const isOwnProduct = Boolean(userId && userId === sellerId);
  const isChatRestricted = Boolean(
    userId &&
    sellerId &&
    !isOwnProduct &&
    (block.isPending || block.isError || block.isBlocked),
  );

  const handleStartChat = () => {
    if (
      isAuthLoading ||
      mutation.isPending ||
      isOwnProduct ||
      !sellerId ||
      isChatRestricted
    )
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
        disabled={
          isAuthLoading || isOwnProduct || !sellerId || isChatRestricted
        }
        isLoading={mutation.isPending}
        onClick={handleStartChat}
      >
        채팅하기
      </Button>
      {userId &&
        sellerId &&
        !isOwnProduct &&
        (block.isError ? (
          <div className="text-body-14 text-black-900">
            <p role="alert">대화 가능 여부를 확인하지 못했습니다.</p>
            <Button
              size="sm"
              disabled={block.isFetching}
              onClick={() => void block.refetch()}
            >
              다시 확인
            </Button>
          </div>
        ) : block.isBlocked ? (
          <p className="text-body-14 text-black-900">
            이 사용자와 새 대화를 시작할 수 없습니다. 기존 채팅 목록에서 대화를
            확인해주세요.
          </p>
        ) : block.isPending ? (
          <p role="status" className="text-body-14 text-black-900">
            대화 가능 여부를 확인하고 있습니다.
          </p>
        ) : null)}
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
