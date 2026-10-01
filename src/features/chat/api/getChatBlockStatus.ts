import { doc, getDocFromServer } from "firebase/firestore";

import type { ChatBlockStatus } from "@/features/chat/types/chatModeration";
import { validateChatDocumentId } from "@/features/chat/utils/validateChatDocumentId";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";
import { validateFirebaseUser } from "@/lib/validateFirebaseUser";

export async function getChatBlockStatus(
  userId: string,
  partnerId: string,
): Promise<ChatBlockStatus> {
  for (const id of [userId, partnerId]) validateChatDocumentId(id);
  await firebaseAuth.authStateReady();
  validateFirebaseUser(userId);
  const [mine, partner] = await Promise.all([
    getDocFromServer(doc(firebaseDb, "users", userId, "chatBlocks", partnerId)),
    getDocFromServer(doc(firebaseDb, "users", partnerId, "chatBlocks", userId)),
  ]);
  validateFirebaseUser(userId);
  return { isBlockedByMe: mine.exists(), isBlockedByPartner: partner.exists() };
}
