import { doc, getDocFromServer } from "firebase/firestore";

import { getChatRoomView } from "@/features/chat/api/getChatRoomView";
import { parseChatRoom } from "@/features/chat/utils/parseChatRoom";
import { validateChatDocumentId } from "@/features/chat/utils/validateChatDocumentId";
import { validateChatUser } from "@/features/chat/utils/validateChatUser";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";

export async function getChatRoom(roomId: string, userId: string) {
  validateChatDocumentId(roomId);
  await firebaseAuth.authStateReady();
  validateChatUser(userId);
  const snapshot = await getDocFromServer(doc(firebaseDb, "chatRooms", roomId));
  validateChatUser(userId);
  if (!snapshot.exists()) return null;
  const room = parseChatRoom(snapshot.id, snapshot.data());
  return getChatRoomView(room, userId);
}
