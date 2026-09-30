import {
  collection,
  getDocsFromServer,
  query,
  where,
} from "firebase/firestore";

import { getChatRoomView } from "@/features/chat/api/getChatRoomView";
import { parseChatRoom } from "@/features/chat/utils/parseChatRoom";
import { validateChatUser } from "@/features/chat/utils/validateChatUser";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";

export async function getChatRooms(userId: string) {
  await firebaseAuth.authStateReady();
  validateChatUser(userId);
  const snapshot = await getDocsFromServer(
    query(
      collection(firebaseDb, "chatRooms"),
      where("visibleTo", "array-contains", userId),
    ),
  );
  validateChatUser(userId);
  const rooms = await Promise.all(
    snapshot.docs.map((room) =>
      getChatRoomView(parseChatRoom(room.id, room.data()), userId),
    ),
  );
  validateChatUser(userId);
  return rooms.sort((first, second) =>
    second.createdAt.localeCompare(first.createdAt),
  );
}
