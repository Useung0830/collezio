"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";

import { removeUserQueries } from "@/features/auth/utils/removeUserQueries";

import { firebaseAuth } from "@/lib/firebase";

export default function AuthQueryCleanup() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let previousUserId = firebaseAuth.currentUser?.uid;
    return onAuthStateChanged(firebaseAuth, (user) => {
      const userId = user?.uid;
      if (previousUserId && previousUserId !== userId) {
        removeUserQueries(queryClient, previousUserId);
      }
      previousUserId = userId;
    });
  }, [queryClient]);

  return null;
}
