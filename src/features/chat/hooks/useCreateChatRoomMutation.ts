import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createChatRoom } from "@/features/chat/api/createChatRoom";
import { chatQueryKeys } from "@/features/chat/queries/chatQueryKeys";

export function useCreateChatRoomMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createChatRoom,
    retry: false,
    onSuccess: (_roomId, { userId }) => {
      void queryClient.invalidateQueries({
        queryKey: chatQueryKeys.list(userId),
      });
    },
  });
}
