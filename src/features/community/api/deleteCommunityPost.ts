import type { Query } from "firebase/firestore";
import {
  collection,
  deleteDoc,
  doc,
  getDocsFromServer,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";

import { deleteCommunityImages } from "@/features/community/api/deleteCommunityImages";
import { getCommunityDeletion } from "@/features/community/api/getCommunityDeletion";
import { CommunityPostSaveError } from "@/features/community/utils/communityPostSaveError";

import { firebaseDb } from "@/lib/firebase";
import { validateFirebaseUser } from "@/lib/validateFirebaseUser";

const DELETE_BATCH_SIZE = 100;

async function deleteRelatedDocuments(documentsQuery: Query, userId: string) {
  for (;;) {
    validateFirebaseUser(userId);
    const snapshot = await getDocsFromServer(documentsQuery);
    if (snapshot.empty) return;
    const batch = writeBatch(firebaseDb);
    for (const document of snapshot.docs) batch.delete(document.ref);
    await batch.commit();
  }
}

export async function deleteCommunityPost({
  postId,
  userId,
}: {
  postId: string;
  userId: string;
}) {
  validateFirebaseUser(userId);
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(postId))
    throw new Error("올바른 게시글 주소가 아닙니다.");
  const reference = doc(firebaseDb, "communityPosts", postId);
  const deletionRef = doc(firebaseDb, "communityPostDeletions", postId);
  try {
    await runTransaction(firebaseDb, async (transaction) => {
      validateFirebaseUser(userId);
      const post = await transaction.get(reference);
      if (!post.exists()) return;
      if (post.data().authorId !== userId)
        throw new CommunityPostSaveError("본인 게시글만 삭제할 수 있습니다.");
      transaction.set(deletionRef, {
        authorId: userId,
        images: post.data().images,
        createdAt: serverTimestamp(),
      });
      transaction.delete(reference);
    });
    const deletion = await getCommunityDeletion(postId, userId);
    if (!deletion) return;
    await deleteRelatedDocuments(
      query(
        collection(firebaseDb, "communityComments"),
        where("postId", "==", postId),
        limit(DELETE_BATCH_SIZE),
      ),
      userId,
    );
    await deleteRelatedDocuments(
      query(collection(reference, "likes"), limit(DELETE_BATCH_SIZE)),
      userId,
    );
    if (!(await deleteCommunityImages(deletion.paths)))
      throw new Error("사진 정리 실패");
    validateFirebaseUser(userId);
    await deleteDoc(deletionRef);
  } catch (error) {
    if (error instanceof CommunityPostSaveError) throw error;
    throw new CommunityPostSaveError(
      "삭제를 완료하지 못했습니다. 연결 상태를 확인하고 다시 시도해주세요. 이미 삭제한 글의 남은 사진과 댓글 정리도 이어서 진행됩니다.",
    );
  }
}
