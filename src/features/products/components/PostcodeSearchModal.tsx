"use client";

import { useEffect, useEffectEvent, useId, useRef } from "react";

import IconButton from "@/components/common/button/IconButton";

import CloseIcon from "@/assets/icons/icon-close.svg";

type PostcodeSearchModalProps = {
  onSelect: (address: string) => void;
  onClose: () => void;
  onError: () => void;
};

export default function PostcodeSearchModal({
  onSelect,
  onClose,
  onError,
}: PostcodeSearchModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const handleSelect = useEffectEvent(onSelect);
  const handleError = useEffectEvent(onError);

  useEffect(() => {
    const dialog = dialogRef.current;
    const container = containerRef.current;
    const Postcode = window.kakao?.Postcode;
    if (!dialog || !container || !Postcode) {
      handleError();
      return;
    }

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    let isActive = true;

    dialog.showModal();
    document.body.style.overflow = "hidden";
    try {
      new Postcode({
        width: "100%",
        height: "100%",
        oncomplete: ({ address }) => {
          if (isActive) handleSelect(address);
        },
      }).embed(container, { autoClose: false });
    } catch {
      handleError();
    }

    return () => {
      isActive = false;
      container.replaceChildren();
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="text-black-900 fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-125 overflow-y-auto rounded-2xl bg-white p-0 shadow-xl backdrop:bg-black/40"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <h2 id={titleId} className="text-heading-20">
          거래 희망 장소 검색
        </h2>
        <IconButton size="sm" aria-label="주소 검색 닫기" onClick={onClose}>
          <CloseIcon className="size-5" aria-hidden="true" />
        </IconButton>
      </div>
      <div ref={containerRef} className="h-[min(500px,70dvh)] min-h-100" />
    </dialog>
  );
}
