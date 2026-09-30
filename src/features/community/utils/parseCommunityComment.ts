import { Timestamp } from "firebase/firestore";

import type { CommunityCommentDocument } from "@/features/community/types/communityDocument";

export function parseCommunityComment(
  id: string,
  value: unknown,
): CommunityCommentDocument {
  if (typeof value !== "object" || value === null)
    throw new Error("댓글 정보를 확인할 수 없습니다.");
  const data = value as Record<string, unknown>;
  if (
    typeof data.authorId !== "string" ||
    !data.authorId ||
    data.authorId.includes("/") ||
    typeof data.postId !== "string" ||
    !data.postId ||
    data.postId.includes("/") ||
    typeof data.content !== "string" ||
    !data.content.trim() ||
    data.content.length > 1000 ||
    !(data.createdAt instanceof Timestamp) ||
    !(data.updatedAt instanceof Timestamp)
  )
    throw new Error("댓글 정보를 확인할 수 없습니다.");
  return {
    id,
    authorId: data.authorId,
    postId: data.postId,
    content: data.content,
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
    version: `${data.updatedAt.seconds}:${data.updatedAt.nanoseconds}`,
  };
}
