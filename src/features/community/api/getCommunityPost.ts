import { doc, getDoc } from "firebase/firestore";

import { parseCommunityPost } from "@/features/community/utils/parseCommunityPost";

import { firebaseDb } from "@/lib/firebase";

export async function getCommunityPost(postId: string) {
  if (!postId || postId.includes("/") || postId === "." || postId === "..") {
    throw new Error("올바른 게시글 주소가 아닙니다.");
  }
  const snapshot = await getDoc(doc(firebaseDb, "communityPosts", postId));
  return snapshot.exists()
    ? parseCommunityPost(snapshot.id, snapshot.data())
    : null;
}
