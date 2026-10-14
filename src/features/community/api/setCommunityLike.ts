import {
  doc,
  getDocFromServer,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { CommunityPostSaveError } from "@/features/community/utils/communityPostSaveError";

import { firebaseDb } from "@/lib/firebase";
import { validateFirebaseUser } from "@/lib/validateFirebaseUser";

export async function setCommunityLike({
  postId,
  userId,
  isLiked,
}: {
  postId: string;
  userId: string;
  isLiked: boolean;
}) {
  validateFirebaseUser(userId);
  const reference = doc(firebaseDb, "communityPosts", postId);
  const likeRef = doc(reference, "likes", userId);
  try {
    return await runTransaction(firebaseDb, async (transaction) => {
      validateFirebaseUser(userId);
      const post = await transaction.get(reference);
      const like = await transaction.get(likeRef);
      if (!post.exists())
        throw new CommunityPostSaveError("삭제된 게시글입니다.");
      if (isLiked && post.data().authorId === userId)
        throw new CommunityPostSaveError(
          "본인 게시글에는 좋아요를 누를 수 없습니다.",
        );
      const count = post.data().likeCount;
      if (!Number.isSafeInteger(count) || count < 0)
        throw new CommunityPostSaveError("좋아요 정보를 확인할 수 없습니다.");
      if (like.exists() === isLiked)
        return { isLiked, likeCount: count as number };
      const likeCount = count + (isLiked ? 1 : -1);
      if (likeCount < 0 || !Number.isSafeInteger(likeCount))
        throw new CommunityPostSaveError("좋아요 정보를 확인할 수 없습니다.");
      if (isLiked) transaction.set(likeRef, { createdAt: serverTimestamp() });
      else transaction.delete(likeRef);
      transaction.update(reference, { likeCount });
      return { isLiked, likeCount };
    });
  } catch (error) {
    if (error instanceof CommunityPostSaveError) throw error;
    validateFirebaseUser(userId);
    const [post, like] = await Promise.all([
      getDocFromServer(reference),
      getDocFromServer(likeRef),
    ]);
    validateFirebaseUser(userId);
    const count = post.data()?.likeCount;
    if (
      post.exists() &&
      like.exists() === isLiked &&
      typeof count === "number" &&
      Number.isSafeInteger(count) &&
      count >= 0
    )
      return { isLiked, likeCount: count };
    throw error;
  }
}
