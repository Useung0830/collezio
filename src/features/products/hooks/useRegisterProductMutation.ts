import { useMutation } from "@tanstack/react-query";

import { registerProduct } from "@/features/products/api/registerProduct";

export function useRegisterProductMutation() {
  return useMutation({
    mutationFn: registerProduct,
    retry: false,
  });
}
