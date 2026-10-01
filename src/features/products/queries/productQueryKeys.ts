export const productQueryKeys = {
  all: ["products"],
  newest: ["products", "newest"],
  popular: ["products", "popular"],
  detail: (productId: string, userId: string | null | undefined) => [
    "products",
    "detail",
    productId,
    userId,
  ],
  mine: ["products", "mine"],
  myList: (userId: string | null | undefined) => ["products", "mine", userId],
};
