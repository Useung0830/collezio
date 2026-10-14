import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateProductFavorite } from "@/features/favorite/api/updateProductFavorite";
import { favoriteQueryKeys } from "@/features/favorite/queries/favoriteQueryKeys";
import { productQueryKeys } from "@/features/products/queries/productQueryKeys";
import type { RegisteredProductDetail } from "@/features/products/types/product";

import { firebaseAuth } from "@/lib/firebase";

export function useUpdateProductFavoriteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProductFavorite,
    retry: false,
    onMutate: ({ productId, userId }) =>
      Promise.all([
        queryClient.cancelQueries({
          queryKey: favoriteQueryKeys.detail(productId, userId),
        }),
        queryClient.cancelQueries({
          queryKey: productQueryKeys.detail(productId, userId),
        }),
      ]),
    onSuccess: (result, { productId, userId }) => {
      if (firebaseAuth.currentUser?.uid !== userId) return;
      queryClient.setQueryData(
        favoriteQueryKeys.detail(productId, userId),
        result.isFavorite,
      );
      queryClient.setQueryData<RegisteredProductDetail | null>(
        productQueryKeys.detail(productId, userId),
        (product) =>
          product
            ? { ...product, favoriteCount: result.favoriteCount }
            : product,
      );
    },
    // 응답이 유실되어 오류가 나도 DB 저장은 끝났을 수 있어 다시 확인합니다.
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: productQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: favoriteQueryKeys.all }),
      ]),
  });
}
