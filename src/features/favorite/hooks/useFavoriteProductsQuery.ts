import { useEffect, useState } from "react";
import { skipToken, useQuery } from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";

import { getFavoriteProducts } from "@/features/favorite/api/getFavoriteProducts";
import { favoriteQueryKeys } from "@/features/favorite/queries/favoriteQueryKeys";

import { firebaseAuth } from "@/lib/firebase";

export function useFavoriteProductsQuery() {
  const [userId, setUserId] = useState<string | null>();
  const productsQuery = useQuery({
    queryKey: favoriteQueryKeys.list(userId),
    queryFn: userId ? () => getFavoriteProducts(userId) : skipToken,
    gcTime: 0,
    retry: false,
  });

  useEffect(
    () =>
      onAuthStateChanged(firebaseAuth, (user) => setUserId(user?.uid ?? null)),
    [],
  );

  return {
    ...productsQuery,
    isAuthLoading: userId === undefined,
    isLoggedIn: Boolean(userId),
  };
}
