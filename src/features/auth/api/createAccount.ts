import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  updateProfile,
} from "firebase/auth";

import type { SignupFormValues } from "@/features/auth/types/signup";
import { createPublicProfile } from "@/features/user/api/createPublicProfile";

import { firebaseAuth } from "@/lib/firebase";

export async function createAccount({
  email,
  password,
  nickname,
}: Pick<SignupFormValues, "email" | "password" | "nickname">) {
  const { user } = await createUserWithEmailAndPassword(
    firebaseAuth,
    email.trim(),
    password,
  );

  await updateProfile(user, { displayName: nickname.trim() });
  await sendEmailVerification(user);
  // 계정 생성 후 프로필 쓰기가 실패해도 가입을 재시도하게 만들지 않습니다.
  // 누락된 문서는 로그인 후 본인 프로필 조회 시 다시 생성합니다.
  try {
    await createPublicProfile(user.uid);
  } catch {
    // 프로필 화면에서 실패 안내와 재시도를 제공합니다.
  }
  await signOut(firebaseAuth);
}
