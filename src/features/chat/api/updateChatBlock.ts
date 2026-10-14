import { doc, runTransaction, serverTimestamp } from "firebase/firestore";

import type { ChatParticipantInput } from "@/features/chat/types/chatModeration";
import { validateChatDocumentId } from "@/features/chat/utils/validateChatDocumentId";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";
import { validateFirebaseUser } from "@/lib/validateFirebaseUser";

export async function updateChatBlock({
  userId,
  partnerId,
  roomId,
  isBlocked,
}: ChatParticipantInput & { isBlocked: boolean }) {
  for (const id of [userId, partnerId, roomId]) validateChatDocumentId(id);
  if (userId === partnerId) throw new Error("자신을 차단할 수 없습니다.");
  await firebaseAuth.authStateReady();
  validateFirebaseUser(userId);
  const ref = doc(firebaseDb, "users", userId, "chatBlocks", partnerId);
  await runTransaction(firebaseDb, async (transaction) => {
    validateFirebaseUser(userId);
    const existing = await transaction.get(ref);
    if (isBlocked && !existing.exists())
      transaction.set(ref, { createdAt: serverTimestamp() });
    if (!isBlocked && existing.exists()) transaction.delete(ref);
  });
  validateFirebaseUser(userId);
}
