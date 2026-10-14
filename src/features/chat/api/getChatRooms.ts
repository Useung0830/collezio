import {
  collection,
  getDocsFromServer,
  query,
  where,
} from "firebase/firestore";

import { getChatRoomView } from "@/features/chat/api/getChatRoomView";
import { parseChatRoom } from "@/features/chat/utils/parseChatRoom";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";
import { validateFirebaseUser } from "@/lib/validateFirebaseUser";

export async function getChatRooms(userId: string) {
  await firebaseAuth.authStateReady();
  validateFirebaseUser(userId);
  const snapshot = await getDocsFromServer(
    query(
      collection(firebaseDb, "chatRooms"),
      where("visibleTo", "array-contains", userId),
    ),
  );
  validateFirebaseUser(userId);
  const rooms = await Promise.all(
    snapshot.docs.map((room) =>
      getChatRoomView(parseChatRoom(room.id, room.data()), userId),
    ),
  );
  validateFirebaseUser(userId);
  return rooms.sort((first, second) =>
    (second.lastMessage?.createdAt ?? second.createdAt).localeCompare(
      first.lastMessage?.createdAt ?? first.createdAt,
    ),
  );
}
