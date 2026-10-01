"use client";

import type { KeyboardEvent, MouseEvent, SyntheticEvent } from "react";
import { useEffect, useId, useRef } from "react";

import Button from "@/components/common/button/Button";
import { useLogoutMutation } from "@/features/auth/hooks/useLogoutMutation";

type LogoutConfirmModalProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

export default function LogoutConfirmModal({
  onCancel,
  onConfirm,
}: LogoutConfirmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { logout, isPending, isError } = useLogoutMutation();

  const handleConfirm = async () => {
    if (await logout()) onConfirm();
  };

  const handleCancel = () => {
    if (isPending) return;
    dialogRef.current?.close();
    onCancel();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "Escape") event.stopPropagation();
    if (event.key !== "Tab") return;
    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>(
      "button:not(:disabled)",
    );
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (!first || !last) {
      event.preventDefault();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleDialogCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    handleCancel();
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target !== event.currentTarget || isPending) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      handleCancel();
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
      onKeyDown={handleKeyDown}
      onCancel={handleDialogCancel}
      onClick={handleBackdropClick}
      className="text-black-900 m-auto w-[calc(100%-2rem)] max-w-90 rounded-2xl bg-white p-6 shadow-xl backdrop:bg-black/40"
    >
      <h2 id={titleId} className="text-heading-20 text-black-900 text-center">
        로그아웃 하시겠습니까?
      </h2>
      {isError && (
        <p role="alert" className="text-body-14 mt-4 text-red-500">
          로그아웃하지 못했습니다. 다시 시도해주세요.
        </p>
      )}
      <div className="mt-6 grid grid-cols-2 gap-2">
        <Button size="sm" disabled={isPending} onClick={handleCancel}>
          취소
        </Button>
        <Button
          size="sm"
          variant="primary"
          isLoading={isPending}
          onClick={handleConfirm}
        >
          {isPending ? "로그아웃 중" : "로그아웃"}
        </Button>
      </div>
    </dialog>
  );
}
