import { useEffect, useState } from "react";
import { skipToken, useQuery } from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";

import { getPendingProductRegistration } from "@/features/products/api/productRegistration";

import { firebaseAuth } from "@/lib/firebase";

export function useProductRegistrationQuery() {
  const [userId, setUserId] = useState<string | null>();
  useEffect(
    () =>
      onAuthStateChanged(firebaseAuth, (user) => setUserId(user?.uid ?? null)),
    [],
  );
  const query = useQuery({
    queryKey: ["product-registration", userId],
    queryFn: userId ? getPendingProductRegistration : skipToken,
    retry: false,
    gcTime: 0,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
  return {
    ...query,
    isChecking: userId === undefined || (Boolean(userId) && query.isPending),
  };
}
