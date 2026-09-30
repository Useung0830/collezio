export const MAX_COMMUNITY_IMAGE_COUNT = 10;
export const MAX_COMMUNITY_IMAGE_SIZE = 5 * 1024 * 1024;
export const COMMUNITY_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateCommunityImages(files: readonly File[]) {
  if (files.length > MAX_COMMUNITY_IMAGE_COUNT) {
    throw new Error("사진은 최대 10장까지 첨부할 수 있습니다.");
  }
  for (const file of files) {
    if (!COMMUNITY_IMAGE_TYPES.includes(file.type)) {
      throw new Error("JPG, PNG, WebP 사진만 첨부할 수 있습니다.");
    }
    if (file.size === 0 || file.size > MAX_COMMUNITY_IMAGE_SIZE) {
      throw new Error("사진은 빈 파일이 아닌 5MB 이하 파일이어야 합니다.");
    }
  }
}
