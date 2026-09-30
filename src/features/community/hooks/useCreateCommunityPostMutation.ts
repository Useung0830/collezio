import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createCommunityPost } from "@/features/community/api/createCommunityPost";
import { communityQueryKeys } from "@/features/community/queries/communityQueryKeys";
export function useCreateCommunityPostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCommunityPost,
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: communityQueryKeys.all });
    },
  });
}
