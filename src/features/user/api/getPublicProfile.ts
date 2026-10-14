import { doc, getDoc } from "firebase/firestore";

import { createPublicProfile } from "@/features/user/api/createPublicProfile";
import { parsePublicProfile } from "@/features/user/utils/parsePublicProfile";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";

export async function getPublicProfile(userId: string) {
  if (!userId || userId.includes("/") || userId === "." || userId === "..") {
    throw new Error("사용자 정보를 확인할 수 없습니다.");
  }
  await firebaseAuth.authStateReady();
  const snapshot = await getDoc(doc(firebaseDb, "profiles", userId));
  if (snapshot.exists())
    return parsePublicProfile(snapshot.id, snapshot.data());
  if (firebaseAuth.currentUser?.uid === userId)
    return createPublicProfile(userId);
  return null;
}
