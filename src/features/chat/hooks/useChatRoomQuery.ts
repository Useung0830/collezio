import { skipToken, useQuery } from "@tanstack/react-query";

import { getChatRoom } from "@/features/chat/api/getChatRoom";
import { useChatSubscription } from "@/features/chat/hooks/useChatSubscription";
import { useChatUser } from "@/features/chat/hooks/useChatUser";
import { chatQueryKeys } from "@/features/chat/queries/chatQueryKeys";

export function useChatRoomQuery(roomId: string) {
  const auth = useChatUser();
  const userId = auth.userId;
  const subscription = useChatSubscription(userId, "detail", roomId);
  const query = useQuery({
    queryKey: chatQueryKeys.detail(roomId, userId),
    queryFn: userId ? () => getChatRoom(roomId, userId) : skipToken,
    gcTime: 0,
    retry: false,
  });
  return {
    ...query,
    ...auth,
    isPending: query.isPending && !subscription.error,
    isError: query.isError || Boolean(subscription.error),
    refetch: () => {
      subscription.restart();
      return query.refetch();
    },
  };
}
