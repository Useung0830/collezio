import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";

import { parseCommunityComment } from "@/features/community/utils/parseCommunityComment";
import { parseCommunityPost } from "@/features/community/utils/parseCommunityPost";

import { firebaseDb } from "@/lib/firebase";
import { validateFirebaseUser } from "@/lib/validateFirebaseUser";

const PAGE_SIZE = 20;
export async function getMyCommunityComments(
  userId: string,
  cursor?: QueryDocumentSnapshot<DocumentData>,
) {
  validateFirebaseUser(userId);
  const snapshot = await getDocsFromServer(
    query(
      collection(firebaseDb, "communityComments"),
      where("authorId", "==", userId),
      orderBy("createdAt", "desc"),
      ...(cursor ? [startAfter(cursor)] : []),
      limit(PAGE_SIZE + 1),
    ),
  );
  const documents = snapshot.docs.slice(0, PAGE_SIZE);
  const comments = documents.map((document) =>
    parseCommunityComment(document.id, document.data()),
  );
  const posts = await Promise.all(
    [...new Set(comments.map((comment) => comment.postId))].map(
      async (postId) => {
        const post = await getDocFromServer(
          doc(firebaseDb, "communityPosts", postId),
        );
        return [
          postId,
          post.exists() ? parseCommunityPost(postId, post.data()).title : null,
        ] as const;
      },
    ),
  );
  validateFirebaseUser(userId);
  const titles = new Map(posts);
  return {
    comments: comments.flatMap((comment) => {
      const postTitle = titles.get(comment.postId);
      return postTitle ? [{ ...comment, postTitle }] : [];
    }),
    nextCursor: snapshot.size > PAGE_SIZE ? documents.at(-1) : undefined,
  };
}
