import { useInfiniteQuery } from "@tanstack/react-query";

import { getCommunityComments } from "@/features/community/api/getCommunityComments";
import { communityQueryKeys } from "@/features/community/queries/communityQueryKeys";

export function useCommunityCommentsQuery(postId: string) {
  return useInfiniteQuery({
    queryKey: communityQueryKeys.comments(postId),
    initialPageParam: undefined as Parameters<typeof getCommunityComments>[1],
    queryFn: ({ pageParam }) => getCommunityComments(postId, pageParam),
    getNextPageParam: (page) => page.nextCursor,
    retry: false,
  });
}
