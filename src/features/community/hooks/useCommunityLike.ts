import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { getCommunityLike } from "@/features/community/api/getCommunityLike";
import { setCommunityLike } from "@/features/community/api/setCommunityLike";
import { communityQueryKeys } from "@/features/community/queries/communityQueryKeys";

export function useCommunityLike(
  postId: string,
  userId: string | null | undefined,
) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: communityQueryKeys.like(postId, userId),
    queryFn: userId ? () => getCommunityLike(postId, userId) : skipToken,
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: setCommunityLike,
    retry: false,
    onSuccess: (result, input) =>
      client.setQueryData(
        communityQueryKeys.like(postId, input.userId),
        result.isLiked,
      ),
    onSettled: () =>
      client.invalidateQueries({ queryKey: communityQueryKeys.all }),
  });
  return { query, mutation };
}
