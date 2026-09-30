import { useInfiniteQuery } from "@tanstack/react-query";

import { getMyCommunityComments } from "@/features/community/api/getMyCommunityComments";
import { communityQueryKeys } from "@/features/community/queries/communityQueryKeys";

export function useMyCommunityCommentsQuery(userId: string) {
  return useInfiniteQuery({
    queryKey: communityQueryKeys.myComments(userId),
    initialPageParam: undefined as Parameters<typeof getMyCommunityComments>[1],
    queryFn: ({ pageParam }) => getMyCommunityComments(userId, pageParam),
    getNextPageParam: (page) => page.nextCursor,
    retry: false,
  });
}
