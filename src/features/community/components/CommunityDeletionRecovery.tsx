"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FirebaseError } from "firebase/app";

import Button from "@/components/common/button/Button";
import { getCommunityDeletion } from "@/features/community/api/getCommunityDeletion";
import DeleteCommunityPostDialog from "@/features/community/components/DeleteCommunityPostDialog";
import { communityQueryKeys } from "@/features/community/queries/communityQueryKeys";

type CommunityDeletionRecoveryProps = { postId: string; userId: string };

export default function CommunityDeletionRecovery({
  postId,
  userId,
}: CommunityDeletionRecoveryProps) {
  const deletionQuery = useQuery({
    queryKey: communityQueryKeys.deletion(postId, userId),
    queryFn: () => getCommunityDeletion(postId, userId),
    retry: false,
  });
  const [isOpen, setIsOpen] = useState(false);
  if (
    deletionQuery.isError &&
    !(
      deletionQuery.error instanceof FirebaseError &&
      deletionQuery.error.code === "permission-denied"
    )
  )
    return (
      <div className="text-black-900 mt-4">
        <p role="alert" className="text-body-14 mb-3">
          삭제 정리 상태를 확인하지 못했습니다.
        </p>
        <Button
          disabled={deletionQuery.isFetching}
          onClick={() => void deletionQuery.refetch()}
        >
          삭제 상태 다시 조회
        </Button>
      </div>
    );
  if (!deletionQuery.data) return null;
  return (
    <div className="text-black-900 mt-4">
      <p role="status" className="text-body-14 mb-3">
        게시글은 삭제되었습니다. 남은 사진과 댓글 정리를 완료해주세요.
      </p>
      <Button onClick={() => setIsOpen(true)}>삭제 정리 다시 시도</Button>
      {isOpen && (
        <DeleteCommunityPostDialog
          postId={postId}
          userId={userId}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
