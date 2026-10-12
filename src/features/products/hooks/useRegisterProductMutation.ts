import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createRegisterProduct } from "@/features/products/api/registerProduct";
import { productQueryKeys } from "@/features/products/queries/productQueryKeys";

export function useRegisterProductMutation() {
  const queryClient = useQueryClient();
  const [registerProduct] = useState(createRegisterProduct);
  return useMutation({
    mutationFn: registerProduct,
    retry: false,
    onSuccess: () => {
      // Cache refresh must not turn a confirmed save into a failed registration.
      void queryClient.invalidateQueries({ queryKey: productQueryKeys.mine });
      void queryClient.invalidateQueries({ queryKey: productQueryKeys.newest });
    },
  });
}
