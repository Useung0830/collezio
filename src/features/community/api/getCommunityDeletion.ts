import { doc, getDocFromServer } from "firebase/firestore";

import { getCommunityImagePaths } from "@/features/community/utils/getCommunityImagePaths";

import { firebaseDb } from "@/lib/firebase";
import { validateFirebaseUser } from "@/lib/validateFirebaseUser";

export async function getCommunityDeletion(postId: string, userId: string) {
  validateFirebaseUser(userId);
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(postId)) return null;
  const snapshot = await getDocFromServer(
    doc(firebaseDb, "communityPostDeletions", postId),
  );
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  if (data.authorId !== userId)
    throw new Error("본인 게시글만 삭제할 수 있습니다.");
  return { paths: getCommunityImagePaths(data.images, userId, postId) };
}
