"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { skipToken, useQuery } from "@tanstack/react-query";
import type { User } from "firebase/auth";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDocFromServer } from "firebase/firestore";

import Button from "@/components/common/button/Button";
import GoogleSignupForm from "@/features/auth/components/GoogleSignupForm";
import { isGoogleOnlyUser } from "@/features/auth/utils/isGoogleOnlyUser";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";

type GoogleSignupGateProps = { children: ReactNode };

export default function GoogleSignupGate({ children }: GoogleSignupGateProps) {
  const [user, setUser] = useState<User | null>(null);
  const shouldCheckSignup = isGoogleOnlyUser(user);
  const {
    data: isComplete,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["googleSignup", user?.uid],
    queryFn:
      shouldCheckSignup && user
        ? async () => {
            const snapshot = await getDocFromServer(
              doc(firebaseDb, "profiles", user.uid),
            );
            return snapshot.data()?.googleSignupCompleted === true;
          }
        : skipToken,
    retry: false,
  });

  useEffect(() => onAuthStateChanged(firebaseAuth, setUser), []);

  if (!user || !shouldCheckSignup || isComplete) return children;
  if (isPending)
    return (
      <p role="status" className="p-10 text-center">
        가입 정보를 확인하고 있습니다.
      </p>
    );
  if (isError)
    return (
      <main className="flex flex-col items-center gap-4 py-20">
        <p role="alert">
          가입 정보를 불러오지 못했습니다. 연결 상태를 확인해주세요.
        </p>
        <Button onClick={() => void refetch()}>다시 시도</Button>
        <Button onClick={() => void signOut(firebaseAuth)}>로그아웃</Button>
      </main>
    );
  return <GoogleSignupForm key={user.uid} userId={user.uid} />;
}
