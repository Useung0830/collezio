"use client";

import { useEffect, useId, useRef } from "react";

interface ChatActionDialogProps {
  title: string;
  isPending: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function ChatActionDialog({
  title,
  isPending,
  onClose,
  children,
}: ChatActionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!isPending) onClose();
      }}
      className="text-black-900 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-100 overflow-y-auto rounded-2xl bg-white p-6 backdrop:bg-black/40"
    >
      <h2 id={titleId} className="text-heading-20">
        {title}
      </h2>
      {children}
    </dialog>
  );
}
