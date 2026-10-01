export const chatQueryKeys = {
  block: (userId: string | null | undefined, partnerId: string | null) => [
    "chat",
    "block",
    userId,
    partnerId,
  ],
  messages: (roomId: string, userId: string | null | undefined) => [
    "chat",
    "messages",
    userId,
    roomId,
  ],
  list: (userId: string | null | undefined) => ["chat", "list", userId],
  detail: (roomId: string, userId: string | null | undefined) => [
    "chat",
    "detail",
    userId,
    roomId,
  ],
};
