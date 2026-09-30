import { collection, doc, onSnapshot, query, where } from "firebase/firestore";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";

export type ChatSubscriptionScope = "list" | "detail" | "messages";

export function subscribeToChatChanges(
  userId: string,
  scope: ChatSubscriptionScope,
  roomId: string,
  onChange: () => void,
  onError: (error: Error) => void,
) {
  const observer = {
    next: (snapshot: {
      metadata: { hasPendingWrites: boolean; fromCache: boolean };
    }) => {
      if (
        firebaseAuth.currentUser?.uid === userId &&
        !snapshot.metadata.hasPendingWrites &&
        !snapshot.metadata.fromCache
      )
        onChange();
    },
    error: onError,
  };
  const options = { includeMetadataChanges: true };
  if (scope === "list")
    return onSnapshot(
      query(
        collection(firebaseDb, "chatRooms"),
        where("visibleTo", "array-contains", userId),
      ),
      options,
      observer,
    );
  if (scope === "detail")
    return onSnapshot(doc(firebaseDb, "chatRooms", roomId), options, observer);
  return onSnapshot(
    collection(firebaseDb, "chatRooms", roomId, "messages"),
    options,
    observer,
  );
}
