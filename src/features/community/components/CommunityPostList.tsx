"use client";
import Button from "@/components/common/button/Button";
import CommunityPostCard from "@/features/community/components/CommunityPostCard";
import { useCommunityPostsQuery } from "@/features/community/hooks/useCommunityPostsQuery";
export default function CommunityPostList() {
  const postsQuery = useCommunityPostsQuery();
  const posts = Array.from(
    new Map(
      postsQuery.data?.pages
        .flatMap((page) => page.posts)
        .map((post) => [post.id, post]),
    ).values(),
  );
  return (
    <div className="text-black-900">
      {postsQuery.isPending && (
        <p role="status" className="text-body-16 py-8">
          {postsQuery.isPaused
            ? "인터넷 연결을 확인해주세요."
            : "게시글을 불러오고 있습니다."}
        </p>
      )}
      {postsQuery.isError && (
        <div className="py-8">
          <p role="alert" className="text-body-16 mb-3">
            게시글을 불러오지 못했습니다.
          </p>
          <Button
            disabled={postsQuery.isFetching}
            onClick={() =>
              void (postsQuery.isFetchNextPageError
                ? postsQuery.fetchNextPage()
                : postsQuery.refetch())
            }
          >
            다시 시도
          </Button>
        </div>
      )}
      {postsQuery.isSuccess && posts.length === 0 && (
        <p role="status" className="text-body-16 py-8">
          아직 작성된 게시글이 없습니다.
        </p>
      )}
      {posts.map((post) => (
        <CommunityPostCard key={post.id} post={post} />
      ))}
      {postsQuery.hasNextPage && (
        <Button
          className="mt-6 w-full"
          disabled={postsQuery.isFetching}
          onClick={() => void postsQuery.fetchNextPage()}
        >
          {postsQuery.isFetchingNextPage ? "불러오는 중…" : "더보기"}
        </Button>
      )}
    </div>
  );
}
