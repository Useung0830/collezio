import { useSuspenseQuery } from "@tanstack/react-query";

import { getMyProducts } from "@/features/products/api/getMyProducts";
import { productQueryKeys } from "@/features/products/queries/productQueryKeys";

export function useMyProductsQuery(userId: string) {
  return useSuspenseQuery({
    queryKey: productQueryKeys.myList(userId),
    queryFn: () => getMyProducts(userId),
    gcTime: 0,
    retry: false,
  });
}
