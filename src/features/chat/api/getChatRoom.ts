import { doc, getDocFromServer } from "firebase/firestore";

import { getChatRoomView } from "@/features/chat/api/getChatRoomView";
import { parseChatRoom } from "@/features/chat/utils/parseChatRoom";
import { validateChatDocumentId } from "@/features/chat/utils/validateChatDocumentId";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";
import { validateFirebaseUser } from "@/lib/validateFirebaseUser";

export async function getChatRoom(roomId: string, userId: string) {
  validateChatDocumentId(roomId);
  await firebaseAuth.authStateReady();
  validateFirebaseUser(userId);
  const snapshot = await getDocFromServer(doc(firebaseDb, "chatRooms", roomId));
  validateFirebaseUser(userId);
  if (!snapshot.exists()) return null;
  const room = parseChatRoom(snapshot.id, snapshot.data());
  return getChatRoomView(room, userId);
}
