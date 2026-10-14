import { useEffect, useState } from "react";
import { skipToken, useQuery } from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";

import { getRegisteredProduct } from "@/features/products/api/getRegisteredProduct";
import { productQueryKeys } from "@/features/products/queries/productQueryKeys";

import { firebaseAuth } from "@/lib/firebase";

export function useProductDetailQuery(productId: string) {
  const [userId, setUserId] = useState<string | null>();
  const productQuery = useQuery({
    queryKey: productQueryKeys.detail(productId, userId),
    queryFn:
      userId === undefined
        ? skipToken
        : () => getRegisteredProduct(productId, userId),
    gcTime: 0,
    retry: false,
  });

  useEffect(
    () =>
      onAuthStateChanged(firebaseAuth, (user) => {
        setUserId(user?.uid ?? null);
      }),
    [],
  );

  return productQuery;
}
