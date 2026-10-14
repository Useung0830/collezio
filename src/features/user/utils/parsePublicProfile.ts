import type { PublicProfile } from "@/features/user/types/profile";

export function parsePublicProfile(id: string, data: unknown): PublicProfile {
  if (
    typeof data !== "object" ||
    data === null ||
    !("nickname" in data) ||
    typeof data.nickname !== "string" ||
    !data.nickname.trim()
  ) {
    throw new Error("프로필 정보를 확인할 수 없습니다.");
  }
  let imageUrl: string | null = null;
  if ("imageUrl" in data && typeof data.imageUrl === "string") {
    try {
      const url = new URL(data.imageUrl);
      if (
        url.protocol === "https:" &&
        url.hostname === "firebasestorage.googleapis.com" &&
        !url.port &&
        !url.username &&
        !url.password &&
        url.pathname.startsWith(
          `/v0/b/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/o/`,
        )
      )
        imageUrl = data.imageUrl;
    } catch {
      // 오래된 이미지 주소가 잘못되어도 닉네임과 소개는 표시합니다.
    }
  }
  return {
    id,
    nickname: data.nickname,
    imageUrl,
    bio: "bio" in data && typeof data.bio === "string" ? data.bio : "",
    rating:
      "rating" in data &&
      typeof data.rating === "number" &&
      Number.isFinite(data.rating) &&
      data.rating >= 0 &&
      data.rating <= 5
        ? data.rating
        : null,
    tradeCount:
      "tradeCount" in data &&
      typeof data.tradeCount === "number" &&
      Number.isSafeInteger(data.tradeCount) &&
      data.tradeCount >= 0
        ? data.tradeCount
        : null,
  };
}
