import { firebaseAuth } from "@/lib/firebase";

export function validateFavoriteUser(userId: string) {
  if (!userId || firebaseAuth.currentUser?.uid !== userId) {
    throw new Error(
      "로그인 상태가 변경되었습니다. 로그인 후 다시 시도해주세요.",
    );
  }
}
