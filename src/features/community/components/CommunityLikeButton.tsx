"use client";

import { useRef, useState } from "react";
import Link from "next/link";

import { useCommunityLike } from "@/features/community/hooks/useCommunityLike";
import type { CommunityPostDocument } from "@/features/community/types/communityDocument";
import { CommunityPostSaveError } from "@/features/community/utils/communityPostSaveError";

import GoodIcon from "@/assets/icons/icon-good.svg";

type CommunityLikeButtonProps = {
  post: CommunityPostDocument;
  userId: string | null | undefined;
};

export default function CommunityLikeButton({
  post,
  userId,
}: CommunityLikeButtonProps) {
  const { query, mutation } = useCommunityLike(post.id, userId);
  const isSubmitting = useRef(false);
  const [error, setError] = useState("");
  const isOwner = userId === post.authorId;
  const isLiked = query.data === true;
  const handleClick = async () => {
    if (!userId || isOwner || isSubmitting.current || query.isPending) return;
    isSubmitting.current = true;
    setError("");
    try {
      await mutation.mutateAsync({
        postId: post.id,
        userId,
        isLiked: !isLiked,
      });
    } catch (error) {
      setError(
        error instanceof CommunityPostSaveError
          ? error.message
          : "좋아요를 변경하지 못했습니다. 다시 시도해주세요.",
      );
    } finally {
      isSubmitting.current = false;
    }
  };
  return (
    <div className="text-black-900 border-black-200 border-y py-6">
      <button
        type="button"
        aria-pressed={isLiked}
        disabled={
          !userId ||
          isOwner ||
          query.isPending ||
          query.isError ||
          mutation.isPending
        }
        onClick={() => void handleClick()}
        className={`text-label-14 flex min-w-28 items-center justify-center gap-2 rounded-full border px-5 py-3 disabled:opacity-50 ${isLiked ? "border-brand-green bg-brand-green text-white" : "border-black-300 bg-white"}`}
      >
        <GoodIcon className="size-4" aria-hidden="true" />
        좋아요 {post.likeCount}
      </button>
      {isOwner && (
        <p className="text-caption-12 mt-2">
          본인 게시글에는 좋아요를 누를 수 없습니다.
        </p>
      )}
      {userId === null && (
        <p className="text-body-14 mt-2">
          <Link href="/login" className="underline">
            로그인
          </Link>{" "}
          후 좋아요를 누를 수 있습니다.
        </p>
      )}
      {query.isError && userId && (
        <p role="alert" className="text-body-14 mt-2">
          좋아요 상태를 불러오지 못했습니다.{" "}
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="underline"
          >
            좋아요 다시 조회
          </button>
        </p>
      )}
      {error && (
        <p role="alert" className="text-body-14 mt-2">
          {error}
        </p>
      )}
      {mutation.isPaused && (
        <p role="status" className="text-body-14 mt-2">
          인터넷 연결을 기다리고 있습니다.
        </p>
      )}
    </div>
  );
}
