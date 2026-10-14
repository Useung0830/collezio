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

import { parseCommunityComment } from "@/features/community/utils/parseCommunityComment";

import { firebaseDb } from "@/lib/firebase";

const PAGE_SIZE = 20;
export async function getCommunityComments(
  postId: string,
  cursor?: QueryDocumentSnapshot<DocumentData>,
) {
  const snapshot = await getDocsFromServer(
    query(
      collection(firebaseDb, "communityComments"),
      where("postId", "==", postId),
      orderBy("createdAt", "desc"),
      ...(cursor ? [startAfter(cursor)] : []),
      limit(PAGE_SIZE + 1),
    ),
  );
  const documents = snapshot.docs.slice(0, PAGE_SIZE);
  return {
    comments: documents.map((document) =>
      parseCommunityComment(document.id, document.data()),
    ),
    nextCursor: snapshot.size > PAGE_SIZE ? documents.at(-1) : undefined,
  };
}
