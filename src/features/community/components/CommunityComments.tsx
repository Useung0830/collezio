"use client";

import Link from "next/link";

import Button from "@/components/common/button/Button";
import CommunityCommentForm from "@/features/community/components/CommunityCommentForm";
import CommunityCommentItem from "@/features/community/components/CommunityCommentItem";
import { useCommunityCommentMutation } from "@/features/community/hooks/useCommunityCommentMutation";
import { useCommunityCommentsQuery } from "@/features/community/hooks/useCommunityCommentsQuery";

type CommunityCommentsProps = {
  postId: string;
  userId: string | null | undefined;
};

export default function CommunityComments({
  postId,
  userId,
}: CommunityCommentsProps) {
  const query = useCommunityCommentsQuery(postId);
  const mutation = useCommunityCommentMutation();
  const comments = Array.from(
    new Map(
      query.data?.pages
        .flatMap((page) => page.comments)
        .map((comment) => [comment.id, comment]),
    ).values(),
  );
  return (
    <section className="text-black-900 mt-8" aria-labelledby="comments-title">
      <h2 id="comments-title" className="text-heading-20">
        댓글
      </h2>
      <p className="text-caption-12 mt-2">
        최신순 · 댓글은 작성 후 5분 이내에 수정할 수 있습니다.
      </p>
      {userId ? (
        <CommunityCommentForm
          onSubmit={async (content, commentId) => {
            await mutation.mutateAsync({
              action: "create",
              commentId,
              postId,
              userId,
              content,
            });
          }}
        />
      ) : userId === null ? (
        <p className="text-body-14 mt-4">
          <Link href="/login" className="underline">
            로그인
          </Link>{" "}
          후 댓글을 작성할 수 있습니다.
        </p>
      ) : null}
      {query.isPending && (
        <p role="status" className="text-body-14 mt-4">
          {query.isPaused
            ? "인터넷 연결을 확인해주세요."
            : "댓글을 불러오고 있습니다."}
        </p>
      )}
      {query.isError && (
        <div className="mt-4">
          <p role="alert" className="text-body-14">
            댓글을 불러오지 못했습니다.
          </p>
          <Button
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            댓글 다시 조회
          </Button>
        </div>
      )}
      {query.isSuccess && comments.length === 0 && (
        <p className="text-body-14 mt-4">아직 작성된 댓글이 없습니다.</p>
      )}
      <ul className="mt-5">
        {comments.map((comment) => (
          <CommunityCommentItem
            key={comment.id}
            comment={comment}
            userId={userId}
          />
        ))}
      </ul>
      {query.hasNextPage && (
        <Button
          disabled={query.isFetching}
          onClick={() => void query.fetchNextPage()}
          className="mt-4"
        >
          댓글 더보기
        </Button>
      )}
    </section>
  );
}
