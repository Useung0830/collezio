import type { MyProductListItem } from "@/features/products/types/product";

const POPULAR_PRODUCT_COUNT = 4;

export function selectPopularProducts(products: MyProductListItem[]) {
  return [...products]
    .sort(
      (first, second) =>
        second.favoriteCount - first.favoriteCount ||
        (second.createdAt ?? "").localeCompare(first.createdAt ?? "") ||
        first.id.localeCompare(second.id),
    )
    .slice(0, POPULAR_PRODUCT_COUNT);
}
