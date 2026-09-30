import { skipToken, useQuery } from "@tanstack/react-query";

import { getChatRooms } from "@/features/chat/api/getChatRooms";
import { useChatUser } from "@/features/chat/hooks/useChatUser";
import { chatQueryKeys } from "@/features/chat/queries/chatQueryKeys";

export function useChatRoomsQuery() {
  const auth = useChatUser();
  const userId = auth.userId;
  const query = useQuery({
    queryKey: chatQueryKeys.list(userId),
    queryFn: userId ? () => getChatRooms(userId) : skipToken,
    gcTime: 0,
    retry: false,
  });
  return { ...query, ...auth };
}
