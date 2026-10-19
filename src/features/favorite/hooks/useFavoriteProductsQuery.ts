import { useSuspenseQuery } from "@tanstack/react-query";

import { getFavoriteProducts } from "@/features/favorite/api/getFavoriteProducts";
import { favoriteQueryKeys } from "@/features/favorite/queries/favoriteQueryKeys";

export function useFavoriteProductsQuery(userId: string) {
  return useSuspenseQuery({
    queryKey: favoriteQueryKeys.list(userId),
    queryFn: () => getFavoriteProducts(userId),
    gcTime: 0,
    retry: false,
  });
}
