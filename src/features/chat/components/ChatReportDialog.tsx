"use client";

import { useRef, useState } from "react";

import Button from "@/components/common/button/Button";
import ChatActionDialog from "@/features/chat/components/ChatActionDialog";
import {
  CHAT_REPORT_REASONS,
  MAX_CHAT_REPORT_LENGTH,
} from "@/features/chat/constants/chatReport";
import { useCreateChatReportMutation } from "@/features/chat/hooks/useCreateChatReportMutation";
import type {
  ChatParticipantInput,
  CreateChatReportInput,
} from "@/features/chat/types/chatModeration";

type ChatReportDialogProps = ChatParticipantInput & { onClose: () => void };

export default function ChatReportDialog({
  userId,
  partnerId,
  roomId,
  onClose,
}: ChatReportDialogProps) {
  const mutation = useCreateChatReportMutation();
  const requestRef = useRef<CreateChatReportInput | null>(null);
  const isSubmitting = useRef(false);
  const [reason, setReason] = useState<CreateChatReportInput["reason"] | "">(
    "",
  );
  const [details, setDetails] = useState("");
  const canSubmit = Boolean(reason && (reason !== "기타" || details.trim()));

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reason || !canSubmit || isSubmitting.current) return;
    isSubmitting.current = true;
    const previous = requestRef.current;
    const request =
      previous?.reason === reason && previous.details === details.trim()
        ? previous
        : {
            userId,
            partnerId,
            roomId,
            reason,
            details: details.trim(),
            reportId: crypto.randomUUID(),
          };
    requestRef.current = request;
    try {
      await mutation.mutateAsync(request);
    } catch {
      // 입력과 요청 ID를 보존하여 응답이 끊겨도 같은 신고로 재시도합니다.
    } finally {
      isSubmitting.current = false;
    }
  };

  return (
    <ChatActionDialog
      title="사용자 신고"
      isPending={mutation.isPending}
      onClose={onClose}
    >
      {mutation.isSuccess ? (
        <div className="mt-4">
          <p role="status" className="text-body-14">
            신고가 접수되었습니다. 상대방에게 신고 내용은 공개되지 않습니다.
          </p>
          <Button className="mt-6 w-full" onClick={onClose}>
            확인
          </Button>
        </div>
      ) : (
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="mt-4 flex flex-col gap-4"
        >
          <p className="text-body-14">
            신고 사유를 선택해주세요. 신고만으로 상대방이 차단되지는 않습니다.
          </p>
          <fieldset
            disabled={mutation.isPending}
            className="flex flex-col gap-3"
          >
            <legend className="text-label-14 mb-3">신고 사유</legend>
            {CHAT_REPORT_REASONS.map((value) => (
              <label
                key={value}
                className="text-body-14 flex items-center gap-2"
              >
                <input
                  type="radio"
                  name="reason"
                  value={value}
                  checked={reason === value}
                  onChange={() => setReason(value)}
                  required
                />
                {value}
              </label>
            ))}
          </fieldset>
          <label className="text-label-14 flex flex-col gap-2">
            상세 내용{reason === "기타" ? " (필수)" : " (선택)"}
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              disabled={mutation.isPending}
              required={reason === "기타"}
              maxLength={MAX_CHAT_REPORT_LENGTH}
              rows={4}
              className="text-body-14 border-black-200 w-full resize-y rounded-xl border p-3"
            />
          </label>
          {mutation.isError && (
            <p role="alert" className="text-body-14">
              신고를 접수하지 못했습니다. 연결 상태를 확인하고 다시
              시도해주세요.
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              disabled={mutation.isPending}
              onClick={onClose}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || mutation.isPending}
              isLoading={mutation.isPending}
            >
              {mutation.isError ? "신고 다시 시도" : "신고 제출"}
            </Button>
          </div>
        </form>
      )}
    </ChatActionDialog>
  );
}
