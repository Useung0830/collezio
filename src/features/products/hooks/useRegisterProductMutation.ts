import { useMutation, useQueryClient } from "@tanstack/react-query";

import { registerProduct } from "@/features/products/api/registerProduct";
import { productQueryKeys } from "@/features/products/queries/productQueryKeys";

export function useRegisterProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerProduct,
    retry: false,
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: ["product-registration"],
      });
    },
    onSuccess: () => {
      // Cache refresh must not turn a confirmed save into a failed registration.
      void queryClient.invalidateQueries({ queryKey: productQueryKeys.mine });
      void queryClient.invalidateQueries({ queryKey: productQueryKeys.newest });
    },
  });
}
