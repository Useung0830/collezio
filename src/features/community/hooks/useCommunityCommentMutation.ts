import { useMutation, useQueryClient } from "@tanstack/react-query";

import { writeCommunityComment } from "@/features/community/api/writeCommunityComment";
import { communityQueryKeys } from "@/features/community/queries/communityQueryKeys";

export function useCommunityCommentMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: writeCommunityComment,
    retry: false,
    onSettled: () =>
      client.invalidateQueries({ queryKey: communityQueryKeys.all }),
  });
}
