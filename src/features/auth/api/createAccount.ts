import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  sendEmailVerification,
  signOut,
  updateProfile,
} from "firebase/auth";

import type { SignupFormValues } from "@/features/auth/types/signup";
import { checkNicknameAvailability } from "@/features/user/api/checkNicknameAvailability";
import { createPublicProfile } from "@/features/user/api/createPublicProfile";

import { firebaseAuth } from "@/lib/firebase";

export async function createAccount({
  email,
  password,
  nickname,
}: Pick<SignupFormValues, "email" | "password" | "nickname">) {
  if (!(await checkNicknameAvailability(nickname))) {
    throw new FirebaseError(
      "functions/already-exists",
      "이미 사용 중인 닉네임입니다.",
    );
  }
  const { user } = await createUserWithEmailAndPassword(
    firebaseAuth,
    email.trim(),
    password,
  );

  await updateProfile(user, { displayName: nickname.trim() });
  // 계정 생성 후 프로필 쓰기가 실패해도 가입을 재시도하게 만들지 않습니다.
  // 누락된 문서는 로그인 후 본인 프로필 조회 시 다시 생성합니다.
  try {
    await createPublicProfile(user.uid);
  } catch (error) {
    if (
      error instanceof FirebaseError &&
      error.code === "functions/already-exists"
    ) {
      await deleteUser(user);
      throw error;
    }
    // 일시적인 실패는 본인 프로필 조회 시 복구합니다.
  }
  await sendEmailVerification(user);
  await signOut(firebaseAuth);
}
