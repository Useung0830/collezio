export function validateProfileNickname(nickname: string) {
  const value = nickname.trim();
  if (value.length < 2 || value.length > 10) {
    throw new Error("닉네임은 2~10자로 입력해주세요.");
  }
  return value;
}

export function validateProfileImage(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("JPG, PNG, WebP 사진만 등록할 수 있습니다.");
  }
  if (file.size === 0 || file.size > 5 * 1024 * 1024) {
    throw new Error("사진은 빈 파일이 아닌 5MB 이하 파일이어야 합니다.");
  }
}
