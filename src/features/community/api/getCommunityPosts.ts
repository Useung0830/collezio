import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";

import { parseCommunityPost } from "@/features/community/utils/parseCommunityPost";

import { firebaseDb } from "@/lib/firebase";

const PAGE_SIZE = 20;

export async function getCommunityPosts(
  cursor?: QueryDocumentSnapshot<DocumentData>,
) {
  const snapshot = await getDocs(
    query(
      collection(firebaseDb, "communityPosts"),
      orderBy("createdAt", "desc"),
      ...(cursor ? [startAfter(cursor)] : []),
      limit(PAGE_SIZE + 1),
    ),
  );
  const documents = snapshot.docs.slice(0, PAGE_SIZE);
  return {
    posts: documents.map((document) =>
      parseCommunityPost(document.id, document.data()),
    ),
    nextCursor:
      snapshot.docs.length > PAGE_SIZE ? documents[documents.length - 1] : null,
  };
}
