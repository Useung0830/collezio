import { useEffect, useState } from "react";
import { skipToken, useQuery } from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";

import { getMyProducts } from "@/features/products/api/getMyProducts";
import { productQueryKeys } from "@/features/products/queries/productQueryKeys";

import { firebaseAuth } from "@/lib/firebase";

export function useMyProductsQuery() {
  const [userId, setUserId] = useState<string | null>();

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (user) => {
      setUserId(user?.uid ?? null);
    });
  }, []);

  const productsQuery = useQuery({
    queryKey: productQueryKeys.myList(userId),
    queryFn: userId ? () => getMyProducts(userId) : skipToken,
    gcTime: 0,
    retry: false,
  });

  return {
    ...productsQuery,
    isAuthLoading: userId === undefined,
    isLoggedIn: Boolean(userId),
  };
}
