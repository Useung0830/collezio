"use client";

import { useRef, useState } from "react";

import Button from "@/components/common/button/Button";
import CommunityCommentForm from "@/features/community/components/CommunityCommentForm";
import { useCommunityCommentMutation } from "@/features/community/hooks/useCommunityCommentMutation";
import type { CommunityCommentDocument } from "@/features/community/types/communityDocument";
import { CommunityPostSaveError } from "@/features/community/utils/communityPostSaveError";
import { formatCommunityDate } from "@/features/community/utils/formatCommunityDate";
import { usePublicProfileQuery } from "@/features/user/hooks/usePublicProfileQuery";

type CommunityCommentItemProps = {
  comment: CommunityCommentDocument;
  userId: string | null | undefined;
};

export default function CommunityCommentItem({
  comment,
  userId,
}: CommunityCommentItemProps) {
  const profile = usePublicProfileQuery(comment.authorId);
  const mutation = useCommunityCommentMutation();
  const isSubmitting = useRef(false);
  const [editing, setEditing] = useState<CommunityCommentDocument | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState("");
  const isOwner = userId === comment.authorId;
  const handleDelete = async () => {
    if (!userId || isSubmitting.current) return;
    isSubmitting.current = true;
    setError("");
    try {
      await mutation.mutateAsync({
        action: "delete",
        postId: comment.postId,
        commentId: comment.id,
        userId,
      });
    } catch (error) {
      setError(
        error instanceof CommunityPostSaveError
          ? error.message
          : "댓글을 삭제하지 못했습니다. 다시 시도해주세요.",
      );
    } finally {
      isSubmitting.current = false;
    }
  };
  return (
    <li className="border-black-200 text-black-900 border-b py-4">
      <p className="text-label-14">
        {profile.data?.nickname ?? "회원"}
        {isOwner ? " (나)" : ""}
      </p>
      <p className="text-caption-12 text-black-500 mt-1">
        <time dateTime={comment.createdAt}>
          {formatCommunityDate(comment.createdAt)}
        </time>
        {comment.createdAt !== comment.updatedAt && " (수정됨)"}
      </p>
      {editing && isOwner ? (
        <CommunityCommentForm
          initialContent={editing.content}
          onCancel={() => setEditing(null)}
          onSubmit={async (content) => {
            await mutation.mutateAsync({
              action: "update",
              postId: comment.postId,
              commentId: comment.id,
              userId,
              version: editing.version,
              content,
            });
            setEditing(null);
          }}
        />
      ) : (
        <p className="text-body-14 mt-2 break-words whitespace-pre-wrap">
          {comment.content}
        </p>
      )}
      {isOwner && !editing && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {!isConfirming ? (
            <>
              <Button
                disabled={mutation.isPending}
                onClick={() => setEditing(comment)}
              >
                댓글 수정
              </Button>
              <Button
                disabled={mutation.isPending}
                onClick={() => setIsConfirming(true)}
              >
                댓글 삭제
              </Button>
            </>
          ) : (
            <>
              <span className="text-body-14">댓글을 삭제할까요?</span>
              <Button
                disabled={mutation.isPending}
                onClick={() => setIsConfirming(false)}
              >
                취소
              </Button>
              <Button
                disabled={mutation.isPending}
                onClick={() => void handleDelete()}
              >
                댓글 삭제 확인
              </Button>
            </>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="text-body-14 mt-2">
          {error}
        </p>
      )}
    </li>
  );
}
