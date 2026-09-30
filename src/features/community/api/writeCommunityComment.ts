import {
  doc,
  getDocFromServer,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { CommunityPostSaveError } from "@/features/community/utils/communityPostSaveError";
import { parseCommunityComment } from "@/features/community/utils/parseCommunityComment";

import { firebaseDb } from "@/lib/firebase";
import { validateFirebaseUser } from "@/lib/validateFirebaseUser";

type CommentInput = { commentId: string; postId: string; userId: string } & (
  | { action: "create"; content: string }
  | { action: "update"; content: string; version: string }
  | { action: "delete" }
);

export async function writeCommunityComment(input: CommentInput) {
  validateFirebaseUser(input.userId);
  if (
    ![input.commentId, input.postId].every((id) =>
      /^[a-zA-Z0-9_-]{1,128}$/.test(id),
    )
  )
    throw new CommunityPostSaveError("올바른 댓글 주소가 아닙니다.");
  const content = input.action === "delete" ? "" : input.content.trim();
  if (input.action !== "delete" && (!content || content.length > 1000))
    throw new CommunityPostSaveError("댓글은 1~1,000자로 입력해주세요.");
  const reference = doc(firebaseDb, "communityComments", input.commentId);
  try {
    await runTransaction(firebaseDb, async (transaction) => {
      validateFirebaseUser(input.userId);
      const snapshot = await transaction.get(reference);
      const post = await transaction.get(
        doc(firebaseDb, "communityPosts", input.postId),
      );
      if (input.action !== "delete" && !post.exists())
        throw new CommunityPostSaveError(
          "삭제된 게시글에는 댓글을 작성할 수 없습니다.",
        );
      if (input.action === "create" && !snapshot.exists()) {
        transaction.set(reference, {
          postId: input.postId,
          authorId: input.userId,
          content,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return;
      }
      if (!snapshot.exists()) {
        if (input.action === "delete") return;
        throw new CommunityPostSaveError("삭제된 댓글입니다.");
      }
      const comment = parseCommunityComment(snapshot.id, snapshot.data());
      if (comment.authorId !== input.userId || comment.postId !== input.postId)
        throw new CommunityPostSaveError("본인 댓글만 변경할 수 있습니다.");
      if (input.action === "create") {
        if (comment.content === content) return;
        throw new CommunityPostSaveError(
          "이미 등록된 댓글입니다. 새로고침 후 확인해주세요.",
        );
      }
      if (input.action === "delete") {
        transaction.delete(reference);
        return;
      }
      if (comment.version !== input.version)
        throw new CommunityPostSaveError(
          "다른 곳에서 수정된 댓글입니다. 취소 후 다시 열어주세요.",
        );
      if (Date.now() - Date.parse(comment.createdAt) >= 5 * 60 * 1000)
        throw new CommunityPostSaveError(
          "댓글은 작성 후 5분 이내에만 수정할 수 있습니다.",
        );
      transaction.update(reference, { content, updatedAt: serverTimestamp() });
    });
  } catch (error) {
    if (input.action !== "create" || error instanceof CommunityPostSaveError)
      throw error;
    validateFirebaseUser(input.userId);
    const saved = await getDocFromServer(reference);
    validateFirebaseUser(input.userId);
    if (
      saved.exists() &&
      saved.data().authorId === input.userId &&
      saved.data().postId === input.postId &&
      saved.data().content === content
    )
      return;
    throw error;
  }
}
