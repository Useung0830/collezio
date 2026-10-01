export const MAX_CHAT_IMAGE_BYTES = 5 * 1024 * 1024;
export const CHAT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateChatImage(file: Pick<File, "size" | "type">) {
  if (!CHAT_IMAGE_TYPES.includes(file.type))
    throw new Error("JPG, PNG, WebP 이미지만 첨부할 수 있습니다.");
  if (file.size <= 0 || file.size > MAX_CHAT_IMAGE_BYTES)
    throw new Error("이미지는 5MB 이하의 파일로 선택해주세요.");
}
