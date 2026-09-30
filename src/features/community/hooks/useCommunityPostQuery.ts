import { useQuery } from "@tanstack/react-query";

import { getCommunityPost } from "@/features/community/api/getCommunityPost";
import { communityQueryKeys } from "@/features/community/queries/communityQueryKeys";
export function useCommunityPostQuery(postId: string) {
  return useQuery({
    queryKey: communityQueryKeys.detail(postId),
    queryFn: () => getCommunityPost(postId),
    retry: false,
  });
}
