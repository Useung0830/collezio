import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  updateProfile,
} from "firebase/auth";

import type { SignupFormValues } from "@/features/auth/types/signup";

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
  await signOut(firebaseAuth);
}
