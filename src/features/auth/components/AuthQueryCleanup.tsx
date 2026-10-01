"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDocFromServer } from "firebase/firestore";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";
import { removeUserQueries } from "@/lib/query/removeUserQueries";

export default function AuthQueryCleanup() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    let previousUserId = firebaseAuth.currentUser?.uid;
    let unsubscribeWithdrawal: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribeWithdrawal?.();
      const userId = user?.uid;
      if (previousUserId && previousUserId !== userId) {
        removeUserQueries(queryClient, previousUserId);
        if (!userId) router.replace("/");
      }
      previousUserId = userId;
      if (userId) {
        const checkWithdrawal = async () => {
          try {
            const snapshot = await getDocFromServer(
              doc(firebaseDb, "withdrawalRequests", userId),
            );
            if (snapshot.exists() && firebaseAuth.currentUser?.uid === userId) {
              queryClient.removeQueries();
              await signOut(firebaseAuth);
            }
          } catch {
            // 일시적인 연결 오류는 다음 주기와 탭 복귀 시 다시 확인합니다.
          }
        };
        const handleFocus = () => {
          void checkWithdrawal();
        };
        void checkWithdrawal();
        const interval = window.setInterval(handleFocus, 30_000);
        window.addEventListener("focus", handleFocus);
        window.addEventListener("online", handleFocus);
        unsubscribeWithdrawal = () => {
          window.clearInterval(interval);
          window.removeEventListener("focus", handleFocus);
          window.removeEventListener("online", handleFocus);
        };
      }
    });
    return () => {
      unsubscribeAuth();
      unsubscribeWithdrawal?.();
    };
  }, [queryClient, router]);

  return null;
}
