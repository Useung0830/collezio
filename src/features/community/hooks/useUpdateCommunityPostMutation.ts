import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateCommunityPost } from "@/features/community/api/updateCommunityPost";
import { communityQueryKeys } from "@/features/community/queries/communityQueryKeys";

export function useUpdateCommunityPostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCommunityPost,
    retry: false,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.all }),
  });
}
