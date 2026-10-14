"use client";

import Link from "next/link";

import Button from "@/components/common/button/Button";
import { useMyCommunityCommentsQuery } from "@/features/community/hooks/useMyCommunityCommentsQuery";
import { formatCommunityDate } from "@/features/community/utils/formatCommunityDate";

type UserCommentListProps = { userId: string };

export default function UserCommentList({ userId }: UserCommentListProps) {
  const query = useMyCommunityCommentsQuery(userId);
  const comments = Array.from(
    new Map(
      query.data?.pages
        .flatMap((page) => page.comments)
        .map((comment) => [comment.id, comment]),
    ).values(),
  );
  return (
    <div
      role="tabpanel"
      id="user-content-comments"
      aria-labelledby="user-content-tab-comments"
      className="text-black-900"
    >
      {query.isPending && (
        <p role="status" className="text-body-14 mt-4">
          {query.isPaused
            ? "인터넷 연결을 확인해주세요."
            : "내 댓글을 불러오고 있습니다."}
        </p>
      )}
      {query.isError && (
        <div className="mt-4">
          <p role="alert" className="text-body-14">
            내 댓글을 불러오지 못했습니다.
          </p>
          <Button
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            내 댓글 다시 조회
          </Button>
        </div>
      )}
      {query.isSuccess && comments.length === 0 && (
        <p className="text-body-14 mt-4">
          표시할 댓글이 없습니다. 삭제된 게시글의 댓글은 표시되지 않습니다.
        </p>
      )}
      <ul>
        {comments.map((comment) => (
          <li
            key={comment.id}
            className="border-black-200 border-b py-4 first:pt-5"
          >
            <Link href={`/community/${comment.postId}`} className="block">
              <p className="text-caption-13 text-black-600 break-words">
                {comment.postTitle}
              </p>
              <h3 className="text-label-16 mt-1 break-words">
                {comment.content}
              </h3>
              <p className="text-caption-12 text-black-600 mt-3">
                <time dateTime={comment.createdAt}>
                  {formatCommunityDate(comment.createdAt)}
                </time>
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {query.hasNextPage && (
        <Button
          className="mt-4"
          disabled={query.isFetching}
          onClick={() => void query.fetchNextPage()}
        >
          내 댓글 더보기
        </Button>
      )}
    </div>
  );
}
