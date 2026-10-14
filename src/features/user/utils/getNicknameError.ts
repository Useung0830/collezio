export function getNicknameError(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error))
    return null;
  if (error.code === "functions/already-exists")
    return "이미 사용 중인 닉네임입니다.";
  if (error.code === "functions/invalid-argument")
    return "닉네임 또는 프로필 사진 정보를 확인해주세요.";
  return null;
}
