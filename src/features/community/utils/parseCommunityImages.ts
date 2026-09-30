import type { CommunityImage } from "@/features/community/types/communityDocument";

export function parseCommunityImages(
  value: unknown,
  authorId: string,
  postId: string,
): CommunityImage[] {
  if (!Array.isArray(value) || value.length > 10) {
    throw new Error("게시글 사진 정보를 확인할 수 없습니다.");
  }
  // 잘못된 이미지 한 장 때문에 공개 게시글 목록 전체가 실패하지 않도록 제외합니다.
  return value.flatMap((image: unknown) => {
    if (
      typeof image !== "object" ||
      image === null ||
      !("path" in image) ||
      !("url" in image) ||
      typeof image.path !== "string" ||
      typeof image.url !== "string"
    ) {
      return [];
    }
    const parts = image.path.split("/");
    const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    let url: URL;
    try {
      url = new URL(image.url);
    } catch {
      return [];
    }
    const expectedOrigin = "https://firebasestorage.googleapis.com";
    if (
      !bucket ||
      parts.length !== 4 ||
      parts[0] !== "community" ||
      parts[1] !== authorId ||
      parts[2] !== postId ||
      !/^[a-zA-Z0-9-]+$/.test(parts[3]) ||
      url.origin !== expectedOrigin ||
      url.username ||
      url.password ||
      url.hash ||
      url.pathname !== `/v0/b/${bucket}/o/${encodeURIComponent(image.path)}` ||
      url.searchParams.get("alt") !== "media"
    ) {
      return [];
    }
    return [{ path: image.path, url: image.url }];
  });
}
