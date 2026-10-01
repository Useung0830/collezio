import { useQuery } from "@tanstack/react-query";

import { getPopularProducts } from "@/features/products/api/getPopularProducts";
import { productQueryKeys } from "@/features/products/queries/productQueryKeys";

export function usePopularProductsQuery() {
  return useQuery({
    queryKey: productQueryKeys.popular,
    queryFn: getPopularProducts,
    retry: false,
  });
}
