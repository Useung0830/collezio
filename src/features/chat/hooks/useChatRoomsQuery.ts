import { skipToken, useQuery } from "@tanstack/react-query";

import { getChatRooms } from "@/features/chat/api/getChatRooms";
import { useChatSubscription } from "@/features/chat/hooks/useChatSubscription";
import { useChatUser } from "@/features/chat/hooks/useChatUser";
import { chatQueryKeys } from "@/features/chat/queries/chatQueryKeys";

export function useChatRoomsQuery() {
  const auth = useChatUser();
  const userId = auth.userId;
  const subscription = useChatSubscription(userId, "list");
  const query = useQuery({
    queryKey: chatQueryKeys.list(userId),
    queryFn: userId ? () => getChatRooms(userId) : skipToken,
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
