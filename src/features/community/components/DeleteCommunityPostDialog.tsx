"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/common/button/Button";
import { useDeleteCommunityPostMutation } from "@/features/community/hooks/useDeleteCommunityPostMutation";
import { CommunityPostSaveError } from "@/features/community/utils/communityPostSaveError";

type DeleteCommunityPostDialogProps = {
  postId: string;
  userId: string;
  onClose: () => void;
};

export default function DeleteCommunityPostDialog({
  postId,
  userId,
  onClose,
}: DeleteCommunityPostDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isSubmitting = useRef(false);
  const router = useRouter();
  const mutation = useDeleteCommunityPostMutation();
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setError("");
    try {
      await mutation.mutateAsync({ postId, userId });
      router.replace("/community");
    } catch (error) {
      isSubmitting.current = false;
      setError(
        error instanceof CommunityPostSaveError
          ? error.message
          : "삭제하지 못했습니다. 다시 시도해주세요.",
      );
    }
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="community-delete-title"
      aria-describedby="community-delete-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!mutation.isPending) onClose();
      }}
      className="text-black-900 m-auto w-[calc(100%-2rem)] max-w-100 rounded-2xl bg-white p-6 backdrop:bg-black/40"
    >
      <h2 id="community-delete-title" className="text-heading-20">
        게시글을 삭제할까요?
      </h2>
      <p id="community-delete-description" className="text-body-14 mt-3">
        게시글과 첨부 사진, 댓글, 좋아요가 삭제됩니다. 삭제한 내용은 복구할 수
        없습니다.
      </p>
      {error && (
        <p role="alert" className="text-body-14 mt-3">
          {error}
        </p>
      )}
      {mutation.isPaused && (
        <p role="status" className="text-body-14 mt-3">
          인터넷 연결을 기다리고 있습니다.
        </p>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <Button
          disabled={mutation.isPending || mutation.isSuccess}
          onClick={onClose}
        >
          취소
        </Button>
        <Button
          disabled={mutation.isPending || mutation.isSuccess}
          isLoading={mutation.isPending}
          onClick={() => void handleDelete()}
        >
          {error ? "삭제 다시 시도" : "삭제 확인"}
        </Button>
      </div>
    </dialog>
  );
}
