export const productQueryKeys = {
  mine: ["products", "mine"],
  myList: (userId: string | null | undefined) => ["products", "mine", userId],
};
