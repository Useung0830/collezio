export const favoriteQueryKeys = {
  all: ["favorites"],
  detail: (productId: string, userId: string | null | undefined) => [
    "favorites",
    "detail",
    userId,
    productId,
  ],
};
