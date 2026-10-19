import { useInfiniteQuery } from "@tanstack/react-query";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

import { getSearchProducts } from "@/features/products/api/getSearchProducts";
import type { ProductCategory } from "@/features/products/constants/productCategories";
import { productQueryKeys } from "@/features/products/queries/productQueryKeys";

export function useSearchProductsQuery(
  category: ProductCategory | null,
  searchText: string,
  isEnabled = true,
) {
  return useInfiniteQuery({
    queryKey: productQueryKeys.search(category, searchText),
    queryFn: ({ pageParam }) =>
      getSearchProducts(category, searchText, pageParam),
    initialPageParam: null as QueryDocumentSnapshot<DocumentData> | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: isEnabled,
    retry: false,
  });
}
