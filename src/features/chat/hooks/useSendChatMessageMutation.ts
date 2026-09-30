import { useMutation, useQueryClient } from "@tanstack/react-query";

import { sendChatMessage } from "@/features/chat/api/sendChatMessage";
import { chatQueryKeys } from "@/features/chat/queries/chatQueryKeys";
import { productQueryKeys } from "@/features/products/queries/productQueryKeys";

export function useSendChatMessageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendChatMessage,
    retry: false,
    onSuccess: ({ roomId }, { userId }) => {
      for (const queryKey of [
        chatQueryKeys.messages(roomId, userId),
        chatQueryKeys.detail(roomId, userId),
        chatQueryKeys.list(userId),
        productQueryKeys.all,
      ]) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
