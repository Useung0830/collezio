export const chatQueryKeys = {
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
