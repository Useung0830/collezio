import { useSuspenseQuery } from "@tanstack/react-query";

import { getNewProducts } from "@/features/products/api/getNewProducts";
import { productQueryKeys } from "@/features/products/queries/productQueryKeys";

export function useNewProductsQuery() {
  return useSuspenseQuery({
    queryKey: productQueryKeys.newest,
    queryFn: getNewProducts,
    retry: false,
  });
}
