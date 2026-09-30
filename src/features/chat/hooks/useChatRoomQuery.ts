import { skipToken, useQuery } from "@tanstack/react-query";

import { getChatRoom } from "@/features/chat/api/getChatRoom";
import { useChatUser } from "@/features/chat/hooks/useChatUser";
import { chatQueryKeys } from "@/features/chat/queries/chatQueryKeys";

export function useChatRoomQuery(roomId: string) {
  const auth = useChatUser();
  const userId = auth.userId;
  const query = useQuery({
    queryKey: chatQueryKeys.detail(roomId, userId),
    queryFn: userId ? () => getChatRoom(roomId, userId) : skipToken,
    gcTime: 0,
    retry: false,
  });
  return { ...query, ...auth };
}
