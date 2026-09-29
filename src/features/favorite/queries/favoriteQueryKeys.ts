export const favoriteQueryKeys = {
  all: ["favorites"],
  list: (userId: string | null | undefined) => ["favorites", "list", userId],
  detail: (productId: string, userId: string | null | undefined) => [
    "favorites",
    "detail",
    userId,
    productId,
  ],
};
