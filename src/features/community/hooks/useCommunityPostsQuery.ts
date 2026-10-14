import { useInfiniteQuery } from "@tanstack/react-query";

import { getCommunityPosts } from "@/features/community/api/getCommunityPosts";
import { communityQueryKeys } from "@/features/community/queries/communityQueryKeys";
export function useCommunityPostsQuery() {
  return useInfiniteQuery({
    queryKey: communityQueryKeys.posts,
    initialPageParam: undefined as Parameters<typeof getCommunityPosts>[0],
    queryFn: ({ pageParam }) => getCommunityPosts(pageParam),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    retry: false,
  });
}
