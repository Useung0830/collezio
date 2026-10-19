export const productQueryKeys = {
  all: ["products"],
  newest: ["products", "newest"],
  popular: ["products", "popular"],
  search: (category: string | null, searchText: string) => [
    "products",
    "search",
    category,
    searchText,
  ],
  detail: (productId: string, userId: string | null | undefined) => [
    "products",
    "detail",
    productId,
    userId,
  ],
  mine: ["products", "mine"],
  myList: (userId: string | null | undefined) => ["products", "mine", userId],
};
