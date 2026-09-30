export const chatQueryKeys = {
  list: (userId: string | null | undefined) => ["chat", "list", userId],
  detail: (roomId: string, userId: string | null | undefined) => [
    "chat",
    "detail",
    userId,
    roomId,
  ],
};
