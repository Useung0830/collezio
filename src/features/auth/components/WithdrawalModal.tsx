"use client";
import { useEffect, useState } from "react";

import Button from "@/components/common/button/Button";
import IconButton from "@/components/common/button/IconButton";
import WithdrawalFeedbackFields from "@/features/auth/components/WithdrawalFeedbackFields";
import type { WithdrawalFeedback } from "@/features/auth/types/withdrawal";

import CloseIcon from "@/assets/icons/icon-close.svg";

type WithdrawalModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (feedback: WithdrawalFeedback) => void;
};

export default function WithdrawalModal({
  isOpen,
  onClose,
  onConfirm,
}: WithdrawalModalProps) {
  const [feedback, setFeedback] = useState<WithdrawalFeedback>({
    reasons: [],
    detail: "",
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleConfirm = () => {
    onConfirm({ ...feedback, detail: feedback.detail.trim() });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="회원 탈퇴 창 닫기"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="withdrawal-title"
        className="relative max-h-full w-full max-w-160 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-8"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="withdrawal-title" className="text-heading-20 text-black-900">
            회원 탈퇴
          </h2>
          <IconButton
            size="sm"
            aria-label="회원 탈퇴 창 닫기"
            onClick={onClose}
          >
            <CloseIcon className="size-5" aria-hidden="true" />
          </IconButton>
        </div>

        <WithdrawalFeedbackFields value={feedback} onChange={setFeedback} />
        <p className="text-body-14 text-black-900 mt-4">
          ???? ??, ??????, ??????? ???? ??? ? ????. ??? ????? ?? ???? ???? ????.
        </p>

        <Button
          size="sm"
          shape="rounded"
          className="mt-6 w-full"
          onClick={handleConfirm}
        >
          회원 탈퇴
        </Button>
      </div>
    </div>
  );
}
