import { useEffect, useState } from "react";
import { skipToken, useQuery } from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";

import { getProductFavorite } from "@/features/favorite/api/getProductFavorite";
import { favoriteQueryKeys } from "@/features/favorite/queries/favoriteQueryKeys";

import { firebaseAuth } from "@/lib/firebase";

export function useProductFavoriteQuery(productId: string) {
  const [userId, setUserId] = useState<string | null>();
  const favoriteQuery = useQuery({
    queryKey: favoriteQueryKeys.detail(productId, userId),
    queryFn: userId ? () => getProductFavorite(productId, userId) : skipToken,
    gcTime: 0,
    retry: false,
  });

  useEffect(
    () =>
      onAuthStateChanged(firebaseAuth, (user) => setUserId(user?.uid ?? null)),
    [],
  );

  return {
    ...favoriteQuery,
    userId,
    isAuthLoading: userId === undefined,
    isLoggedIn: Boolean(userId),
  };
}
