import { doc, runTransaction, serverTimestamp } from "firebase/firestore";

import { parsePublicProfile } from "@/features/user/utils/parsePublicProfile";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";

export async function createPublicProfile(userId: string) {
  await firebaseAuth.authStateReady();
  const user = firebaseAuth.currentUser;
  if (!user || user.uid !== userId) {
    throw new Error("로그인 상태가 변경되었습니다.");
  }
  const reference = doc(firebaseDb, "profiles", userId);
  return runTransaction(firebaseDb, async (transaction) => {
    if (firebaseAuth.currentUser?.uid !== userId) {
      throw new Error("로그인 상태가 변경되었습니다.");
    }
    const snapshot = await transaction.get(reference);
    if (snapshot.exists()) return parsePublicProfile(userId, snapshot.data());
    const nickname = user.displayName?.trim();
    if (!nickname) throw new Error("프로필에 사용할 닉네임이 없습니다.");
    const data = {
      nickname,
      imageUrl: null,
      bio: "",
      createdAt: serverTimestamp(),
    };
    transaction.set(reference, data);
    return parsePublicProfile(userId, data);
  });
}
