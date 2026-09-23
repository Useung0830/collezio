import { useMutation, useQueryClient } from "@tanstack/react-query";

import { registerProduct } from "@/features/products/api/registerProduct";
import { productQueryKeys } from "@/features/products/queries/productQueryKeys";

export function useRegisterProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerProduct,
    retry: false,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: productQueryKeys.mine }),
        queryClient.invalidateQueries({ queryKey: productQueryKeys.newest }),
      ]),
  });
}
