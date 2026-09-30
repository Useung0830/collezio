import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteCommunityPost } from "@/features/community/api/deleteCommunityPost";
import { communityQueryKeys } from "@/features/community/queries/communityQueryKeys";

export function useDeleteCommunityPostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCommunityPost,
    retry: false,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.all }),
  });
}
