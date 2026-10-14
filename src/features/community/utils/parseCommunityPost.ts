import { Timestamp } from "firebase/firestore";

import type { CommunityPostDocument } from "@/features/community/types/communityDocument";

import { parseCommunityImages } from "./parseCommunityImages";

export function parseCommunityPost(
  id: string,
  value: unknown,
): CommunityPostDocument {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("게시글 정보를 확인할 수 없습니다.");
  }
  const data = value as Record<string, unknown>;
  if (
    typeof data.authorId !== "string" ||
    !data.authorId ||
    data.authorId.includes("/") ||
    typeof data.title !== "string" ||
    !data.title.trim() ||
    data.title.length > 100 ||
    typeof data.content !== "string" ||
    !data.content.trim() ||
    data.content.length > 5000 ||
    !(data.createdAt instanceof Timestamp) ||
    !(data.updatedAt instanceof Timestamp) ||
    typeof data.likeCount !== "number" ||
    !Number.isSafeInteger(data.likeCount) ||
    data.likeCount < 0 ||
    typeof data.viewCount !== "number" ||
    !Number.isSafeInteger(data.viewCount) ||
    data.viewCount < 0
  ) {
    throw new Error("게시글 정보를 확인할 수 없습니다.");
  }
  return {
    id,
    authorId: data.authorId,
    title: data.title,
    content: data.content,
    images: parseCommunityImages(data.images, data.authorId, id),
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
    version: `${data.updatedAt.seconds}:${data.updatedAt.nanoseconds}`,
    likeCount: data.likeCount,
    viewCount: data.viewCount,
  };
}
