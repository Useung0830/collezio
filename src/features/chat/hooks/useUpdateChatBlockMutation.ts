import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateChatBlock } from "@/features/chat/api/updateChatBlock";
import { chatQueryKeys } from "@/features/chat/queries/chatQueryKeys";

export function useUpdateChatBlockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateChatBlock,
    networkMode: "always",
    retry: false,
    onSuccess: async (_, { userId, partnerId }) => {
      await queryClient.invalidateQueries({
        queryKey: chatQueryKeys.block(userId, partnerId),
        exact: true,
      });
    },
  });
}
