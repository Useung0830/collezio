import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import {
  collection,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";

import { parseCommunityPost } from "@/features/community/utils/parseCommunityPost";

import { firebaseDb } from "@/lib/firebase";
import { validateFirebaseUser } from "@/lib/validateFirebaseUser";

const PAGE_SIZE = 20;
export async function getMyCommunityPosts(
  userId: string,
  cursor?: QueryDocumentSnapshot<DocumentData>,
) {
  validateFirebaseUser(userId);
  const snapshot = await getDocsFromServer(
    query(
      collection(firebaseDb, "communityPosts"),
      where("authorId", "==", userId),
      orderBy("createdAt", "desc"),
      ...(cursor ? [startAfter(cursor)] : []),
      limit(PAGE_SIZE + 1),
    ),
  );
  validateFirebaseUser(userId);
  const documents = snapshot.docs.slice(0, PAGE_SIZE);
  return {
    posts: documents.map((document) =>
      parseCommunityPost(document.id, document.data()),
    ),
    nextCursor: snapshot.size > PAGE_SIZE ? documents.at(-1) : undefined,
  };
}
