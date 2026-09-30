import { doc, getDocFromServer } from "firebase/firestore";

import { firebaseDb } from "@/lib/firebase";
import { validateFirebaseUser } from "@/lib/validateFirebaseUser";

export async function getCommunityLike(postId: string, userId: string) {
  validateFirebaseUser(userId);
  const snapshot = await getDocFromServer(
    doc(firebaseDb, "communityPosts", postId, "likes", userId),
  );
  validateFirebaseUser(userId);
  return snapshot.exists();
}
