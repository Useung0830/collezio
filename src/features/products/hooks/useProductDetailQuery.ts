import { useSuspenseQuery } from "@tanstack/react-query";

import { getRegisteredProduct } from "@/features/products/api/getRegisteredProduct";
import { productQueryKeys } from "@/features/products/queries/productQueryKeys";

export function useProductDetailQuery(
  productId: string,
  userId: string | null,
) {
  return useSuspenseQuery({
    queryKey: productQueryKeys.detail(productId, userId),
    queryFn: () => getRegisteredProduct(productId, userId),
    gcTime: 0,
    retry: false,
  });
}
