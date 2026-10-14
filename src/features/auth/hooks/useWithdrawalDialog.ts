import type { KeyboardEvent, MouseEvent, SyntheticEvent } from "react";
import { useEffect, useRef } from "react";

export function useWithdrawalDialog(isPending: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const handleClose = () => {
    if (!isPending) onClose();
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
    if (event.key !== "Tab") return;
    const fields = event.currentTarget.querySelectorAll<HTMLElement>(
      "button:not(:disabled), input:not(:disabled), textarea:not(:disabled)",
    );
    const first = fields[0],
      last = fields[fields.length - 1];
    if (!first || !last) event.preventDefault();
    else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return {
    dialogRef,
    handleClose,
    handleCancel,
    handleBackdropClick,
    handleKeyDown,
  };
}
