"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

import { firebaseAuth } from "@/lib/firebase";

type RequireAuthProps = {
  children: React.ReactNode;
};

export default function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let wasAuthenticated = Boolean(firebaseAuth.currentUser);
    return onAuthStateChanged(firebaseAuth, (user) => {
      setIsAuthenticated(Boolean(user));
      if (!user) {
        // 로그아웃·탈퇴 직후에는 전역 인증 처리와 동일하게 홈으로 이동합니다.
        router.replace(wasAuthenticated ? "/" : "/login");
      }
      wasAuthenticated = Boolean(user);
    });
  }, [router]);

  if (!isAuthenticated) {
    return <p role="status">로그인 상태를 확인하고 있습니다.</p>;
  }

  return children;
}
