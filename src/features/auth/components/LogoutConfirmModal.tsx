"use client";

import { useEffect } from "react";

import Button from "@/components/common/button/Button";

type LogoutConfirmModalProps = {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function LogoutConfirmModal({
  isOpen,
  onCancel,
  onConfirm,
}: LogoutConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="로그아웃 확인 창 닫기"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
        className="relative w-full max-w-90 rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2
          id="logout-confirm-title"
          className="text-heading-20 text-black-900 text-center"
        >
          로그아웃 하시겠습니까?
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button size="sm" autoFocus onClick={onCancel}>
            취소
          </Button>
          <Button size="sm" variant="primary" onClick={onConfirm}>
            로그아웃
          </Button>
        </div>
      </div>
    </div>
  );
}
