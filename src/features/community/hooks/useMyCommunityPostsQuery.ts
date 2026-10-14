import { useInfiniteQuery } from "@tanstack/react-query";

import { getMyCommunityPosts } from "@/features/community/api/getMyCommunityPosts";
import { communityQueryKeys } from "@/features/community/queries/communityQueryKeys";

export function useMyCommunityPostsQuery(userId: string) {
  return useInfiniteQuery({
    queryKey: communityQueryKeys.myPosts(userId),
    initialPageParam: undefined as Parameters<typeof getMyCommunityPosts>[1],
    queryFn: ({ pageParam }) => getMyCommunityPosts(userId, pageParam),
    getNextPageParam: (page) => page.nextCursor,
    retry: false,
  });
}
