"use client";

import Link from "next/link";

import Button from "@/components/common/button/Button";
import { useMyCommunityPostsQuery } from "@/features/community/hooks/useMyCommunityPostsQuery";
import { formatCommunityDate } from "@/features/community/utils/formatCommunityDate";

type UserPostListProps = { userId: string };

export default function UserPostList({ userId }: UserPostListProps) {
  const query = useMyCommunityPostsQuery(userId);
  const posts = Array.from(
    new Map(
      query.data?.pages
        .flatMap((page) => page.posts)
        .map((post) => [post.id, post]),
    ).values(),
  );
  return (
    <div
      role="tabpanel"
      id="user-content-posts"
      aria-labelledby="user-content-tab-posts"
      className="text-black-900"
    >
      {query.isPending && (
        <p role="status" className="text-body-14 mt-4">
          {query.isPaused
            ? "인터넷 연결을 확인해주세요."
            : "내 게시글을 불러오고 있습니다."}
        </p>
      )}
      {query.isError && (
        <div className="mt-4">
          <p role="alert" className="text-body-14">
            내 게시글을 불러오지 못했습니다.
          </p>
          <Button
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            내 게시글 다시 조회
          </Button>
        </div>
      )}
      {query.isSuccess && posts.length === 0 && (
        <p className="text-body-14 mt-4">아직 작성한 게시글이 없습니다.</p>
      )}
      <ul>
        {posts.map((post) => (
          <li
            key={post.id}
            className="border-black-200 border-b py-4 first:pt-5"
          >
            <Link href={`/community/${post.id}`} className="block">
              <h3 className="text-label-16 break-words">{post.title}</h3>
              <p className="text-body-14 mt-1 line-clamp-2 break-words">
                {post.content}
              </p>
              <p className="text-caption-12 text-black-600 mt-3">
                <time dateTime={post.createdAt}>
                  {formatCommunityDate(post.createdAt)}
                </time>
                <span className="mx-2">·</span>좋아요 {post.likeCount}
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
          내 게시글 더보기
        </Button>
      )}
    </div>
  );
}
