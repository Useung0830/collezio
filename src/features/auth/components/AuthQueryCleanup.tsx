"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";
import { removeUserQueries } from "@/lib/query/removeUserQueries";

export default function AuthQueryCleanup() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let previousUserId = firebaseAuth.currentUser?.uid;
    let unsubscribeWithdrawal: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribeWithdrawal?.();
      const userId = user?.uid;
      if (previousUserId && previousUserId !== userId) {
        removeUserQueries(queryClient, previousUserId);
      }
      previousUserId = userId;
      if (userId) {
        unsubscribeWithdrawal = onSnapshot(
          doc(firebaseDb, "withdrawalRequests", userId),
          (snapshot) => {
            if (snapshot.exists() && firebaseAuth.currentUser?.uid === userId) {
              queryClient.clear();
              void signOut(firebaseAuth).catch(() => {
                // 저장소 오류가 있으면 다음 인증 갱신에서도 삭제된 계정이 거부됩니다.
              });
            }
          },
          () => {
            // 연결 복구 시 구독이 재개되며 서버 규칙은 탈퇴 계정의 접근을 계속 차단합니다.
          },
        );
      }
    });
    return () => {
      unsubscribeAuth();
      unsubscribeWithdrawal?.();
    };
  }, [queryClient]);

  return null;
}
