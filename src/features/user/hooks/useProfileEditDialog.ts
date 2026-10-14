import type { SyntheticEvent } from "react";
import { useEffect, useRef } from "react";

export function useProfileEditDialog(isPending: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    if (!isPending) onClose();
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  return { dialogRef, handleCancel };
}
