"use client";
import { useEffect, useState } from "react";

import Button from "@/components/common/button/Button";
import IconButton from "@/components/common/button/IconButton";

import CheckIcon from "@/assets/icons/icon-check.svg";
import CloseIcon from "@/assets/icons/icon-close.svg";

type WithdrawalModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const withdrawalReasons = [
  "낮은 서비스 이용 빈도",
  "원하는 상품 탐색 및 교환의 어려움",
  "상품 등록 및 거래 과정의 불편",
  "거래 안전성 및 신뢰에 대한 우려",
  "기타 사유",
];

const MAX_REASON_LENGTH = 200;

export default function WithdrawalModal({
  isOpen,
  onClose,
  onConfirm,
}: WithdrawalModalProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [reasonDetail, setReasonDetail] = useState("");

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

  const handleReasonToggle = (reason: string) => {
    setSelectedReasons((reasons) =>
      reasons.includes(reason)
        ? reasons.filter((selectedReason) => selectedReason !== reason)
        : [...reasons, reason],
    );
  };

  const handleReasonDetailChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setReasonDetail(event.target.value);
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

        <p className="text-heading-24 text-black-900 mt-5">
          탈퇴 사유를 알려주시면 개선을 위해 노력하겠습니다.
        </p>
        <p className="text-body-14 text-black-600 mt-4">
          다중 선택이 가능해요.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {withdrawalReasons.map((reason) => {
            const isSelected = selectedReasons.includes(reason);

            return (
              <button
                key={reason}
                type="button"
                className="text-body-16 text-black-900 flex items-center gap-2 text-left"
                aria-pressed={isSelected}
                onClick={() => handleReasonToggle(reason)}
              >
                <span
                  className={`flex size-4 shrink-0 items-center justify-center rounded-full ${isSelected ? "bg-black-900 text-white" : "bg-black-300 text-white"}`}
                >
                  <CheckIcon className="size-3" aria-hidden="true" />
                </span>
                {reason}
              </button>
            );
          })}
        </div>

        <div className="border-black-300 relative mt-5 rounded-2xl border">
          <textarea
            value={reasonDetail}
            maxLength={MAX_REASON_LENGTH}
            aria-label="탈퇴 사유 상세 입력"
            className="text-body-14 text-black-900 min-h-28 w-full resize-none rounded-2xl bg-transparent p-4 pb-8 outline-none"
            onChange={handleReasonDetailChange}
          />
          <span className="text-caption-12 text-black-400 absolute right-4 bottom-3">
            {reasonDetail.length}/{MAX_REASON_LENGTH}
          </span>
        </div>

        <Button
          size="sm"
          shape="rounded"
          className="mt-6 w-full"
          onClick={onConfirm}
        >
          회원 탈퇴
        </Button>
      </div>
    </div>
  );
}
