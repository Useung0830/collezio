import {
  collection,
  getDocsFromServer,
  orderBy,
  query,
} from "firebase/firestore";

import { parseChatMessage } from "@/features/chat/utils/parseChatMessage";
import { validateChatDocumentId } from "@/features/chat/utils/validateChatDocumentId";
import { validateChatUser } from "@/features/chat/utils/validateChatUser";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";

export async function getChatMessages(roomId: string, userId: string) {
  validateChatDocumentId(roomId);
  await firebaseAuth.authStateReady();
  validateChatUser(userId);
  const snapshot = await getDocsFromServer(
    query(
      collection(firebaseDb, "chatRooms", roomId, "messages"),
      orderBy("createdAt", "asc"),
    ),
  );
  validateChatUser(userId);
  return snapshot.docs.map((message) =>
    parseChatMessage(message.id, message.data()),
  );
}
