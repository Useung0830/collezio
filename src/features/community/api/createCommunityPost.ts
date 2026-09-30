import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import type { CreateCommunityPostInput } from "@/features/community/types/communityDocument";
import { validateCommunityPost } from "@/features/community/utils/validateCommunityPost";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";

export async function createCommunityPost(input: CreateCommunityPostInput) {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("로그인 후 게시글을 작성해주세요.");
  const content = validateCommunityPost(input);
  const document = await addDoc(collection(firebaseDb, "communityPosts"), {
    ...content,
    authorId: user.uid,
    images: [],
    likeCount: 0,
    viewCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return document.id;
}
