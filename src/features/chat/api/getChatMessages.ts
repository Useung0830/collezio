import {
  collection,
  getDocsFromServer,
  orderBy,
  query,
} from "firebase/firestore";

import { parseChatMessage } from "@/features/chat/utils/parseChatMessage";
import { validateChatDocumentId } from "@/features/chat/utils/validateChatDocumentId";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";
import { validateFirebaseUser } from "@/lib/validateFirebaseUser";

export async function getChatMessages(roomId: string, userId: string) {
  validateChatDocumentId(roomId);
  await firebaseAuth.authStateReady();
  validateFirebaseUser(userId);
  const snapshot = await getDocsFromServer(
    query(
      collection(firebaseDb, "chatRooms", roomId, "messages"),
      orderBy("createdAt", "asc"),
    ),
  );
  validateFirebaseUser(userId);
  return snapshot.docs.map((message) =>
    parseChatMessage(message.id, message.data()),
  );
}
