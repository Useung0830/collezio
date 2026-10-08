import { saveProfile } from "@/features/user/api/saveProfile";
import { parsePublicProfile } from "@/features/user/utils/parsePublicProfile";

import { firebaseAuth } from "@/lib/firebase";

export async function createPublicProfile(userId: string) {
  await firebaseAuth.authStateReady();
  const user = firebaseAuth.currentUser;
  if (!user || user.uid !== userId) {
    throw new Error("로그인 상태가 변경되었습니다.");
  }
  const nickname = user.displayName?.trim();
  if (!nickname) throw new Error("프로필에 사용할 닉네임이 없습니다.");
  const data = await saveProfile({ mode: "create", nickname });
  return parsePublicProfile(userId, data.profile);
}
