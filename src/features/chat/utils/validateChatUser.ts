import { firebaseAuth } from "@/lib/firebase";

export function validateChatUser(userId: string) {
  if (!userId || firebaseAuth.currentUser?.uid !== userId) {
    throw new Error("로그인 상태가 변경되었습니다. 다시 로그인해주세요.");
  }
}
