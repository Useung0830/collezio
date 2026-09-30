import { useQuery } from "@tanstack/react-query";

import { getChatMessages } from "@/features/chat/api/getChatMessages";
import { useChatSubscription } from "@/features/chat/hooks/useChatSubscription";
import { chatQueryKeys } from "@/features/chat/queries/chatQueryKeys";

export function useChatMessagesQuery(roomId: string, userId: string) {
  const subscription = useChatSubscription(userId, "messages", roomId);
  const query = useQuery({
    queryKey: chatQueryKeys.messages(roomId, userId),
    queryFn: () => getChatMessages(roomId, userId),
    gcTime: 0,
    retry: false,
  });
  return {
    ...query,
    isPending: query.isPending && !subscription.error,
    isError: query.isError || Boolean(subscription.error),
    refetch: () => {
      subscription.restart();
      return query.refetch();
    },
  };
}
