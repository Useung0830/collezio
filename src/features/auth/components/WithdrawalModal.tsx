"use client";

import type {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  MouseEvent,
  SyntheticEvent,
} from "react";
import { useEffect, useId, useRef, useState } from "react";

import Button from "@/components/common/button/Button";
import WithdrawalFeedbackFields from "@/features/auth/components/WithdrawalFeedbackFields";
import { useWithdrawalMutation } from "@/features/auth/hooks/useWithdrawalMutation";
import type { WithdrawalFeedback } from "@/features/auth/types/withdrawal";

type WithdrawalModalProps = { onClose: () => void; onConfirm: () => void };

export default function WithdrawalModal({
  onClose,
  onConfirm,
}: WithdrawalModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { withdraw, isPending, errorMessage } = useWithdrawalMutation();
  const [feedback, setFeedback] = useState<WithdrawalFeedback>({
    reasons: [],
    detail: "",
  });
  const [password, setPassword] = useState("");
  const handleClose = () => {
    if (!isPending) onClose();
  };
  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) =>
    setPassword(event.currentTarget.value);
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await withdraw({ feedback, password })) onConfirm();
  };
  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    handleClose();
  };
  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      handleClose();
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "Escape") event.stopPropagation();
  };
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-busy={isPending}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      className="text-black-900 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-160 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl backdrop:bg-black/40 sm:p-8"
    >
      <h2 id={titleId} className="text-heading-20">
        회원 탈퇴
      </h2>
      <form onSubmit={handleSubmit}>
        <WithdrawalFeedbackFields
          value={feedback}
          onChange={setFeedback}
          disabled={isPending}
        />
        <p className="text-body-14 mt-4">
          탈퇴하면 계정, 상품·이미지, 게시글·댓글이 삭제되며 복구할 수 없습니다.
          채팅은 상대방에게 탈퇴 회원으로 표시되어 남습니다.
        </p>
        <label className="text-label-14 mt-4 flex flex-col gap-2">
          본인 확인을 위한 비밀번호
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            disabled={isPending}
            onChange={handlePasswordChange}
            className="border-black-300 text-body-16 rounded-xl border p-3"
          />
        </label>
        {errorMessage && (
          <p role="alert" className="text-body-14 mt-3 text-red-500">
            {errorMessage}
          </p>
        )}
        {isPending && (
          <p role="status" className="text-body-14 mt-3">
            탈퇴를 처리하고 있습니다. 잠시 기다려주세요.
          </p>
        )}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button type="button" disabled={isPending} onClick={handleClose}>
            취소
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isPending}
            isLoading={isPending}
          >
            회원 탈퇴
          </Button>
        </div>
      </form>
    </dialog>
  );
}
