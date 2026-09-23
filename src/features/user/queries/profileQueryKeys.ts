export const profileQueryKeys = {
  detail: (
    userId: string | null | undefined,
    viewerId: string | null | undefined,
  ) => ["profiles", userId, viewerId],
};
