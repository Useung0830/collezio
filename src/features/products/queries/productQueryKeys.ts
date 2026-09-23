export const productQueryKeys = {
  detail: (productId: string, userId: string | null | undefined) => [
    "products",
    "detail",
    productId,
    userId,
  ],
  mine: ["products", "mine"],
  myList: (userId: string | null | undefined) => ["products", "mine", userId],
};
