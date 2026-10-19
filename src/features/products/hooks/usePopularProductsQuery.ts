import { useSuspenseQuery } from "@tanstack/react-query";

import { getPopularProducts } from "@/features/products/api/getPopularProducts";
import { productQueryKeys } from "@/features/products/queries/productQueryKeys";

export function usePopularProductsQuery() {
  return useSuspenseQuery({
    queryKey: productQueryKeys.popular,
    queryFn: getPopularProducts,
    retry: false,
  });
}
