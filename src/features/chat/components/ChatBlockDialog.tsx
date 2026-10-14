"use client";

import { useRef } from "react";

import Button from "@/components/common/button/Button";
import ChatActionDialog from "@/features/chat/components/ChatActionDialog";
import { useUpdateChatBlockMutation } from "@/features/chat/hooks/useUpdateChatBlockMutation";
import type { ChatParticipantInput } from "@/features/chat/types/chatModeration";

type ChatBlockDialogProps = ChatParticipantInput & {
  isBlocked: boolean;
  onClose: () => void;
};

export default function ChatBlockDialog({
  isBlocked,
  onClose,
  ...input
}: ChatBlockDialogProps) {
  const mutation = useUpdateChatBlockMutation();
  const isSubmitting = useRef(false);
  const handleConfirm = async () => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    try {
      await mutation.mutateAsync({ ...input, isBlocked: !isBlocked });
      onClose();
    } catch {
      isSubmitting.current = false;
    }
  };
  return (
    <ChatActionDialog
      title={isBlocked ? "차단을 해제할까요?" : "상대방을 차단할까요?"}
      isPending={mutation.isPending}
      onClose={onClose}
    >
      <p className="text-body-14 mt-4">
        {isBlocked
          ? "차단을 해제하면 다시 대화할 수 있습니다. 상대방도 나를 차단한 경우에는 메시지를 보낼 수 없습니다."
          : "이 사용자와의 모든 채팅방에서 서로 메시지를 보낼 수 없고 새 대화를 시작할 수 없습니다. 기존 대화는 유지되며, 상대방에게 차단 알림을 보내지 않습니다."}
      </p>
      {mutation.isError && (
        <p role="alert" className="text-body-14 mt-3">
          변경하지 못했습니다. 연결 상태를 확인하고 다시 시도해주세요.
        </p>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <Button disabled={mutation.isPending} onClick={onClose}>
          취소
        </Button>
        <Button
          disabled={mutation.isPending}
          isLoading={mutation.isPending}
          onClick={() => void handleConfirm()}
        >
          {isBlocked ? "차단 해제 확인" : "차단 확인"}
        </Button>
      </div>
    </ChatActionDialog>
  );
}
