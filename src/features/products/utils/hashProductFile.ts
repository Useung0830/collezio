export async function hashProductFile(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("JPG, PNG, WebP 사진만 등록할 수 있습니다.");
  if (file.size === 0 || file.size > 5 * 1024 * 1024)
    throw new Error("사진은 빈 파일이 아닌 5MB 이하 파일이어야 합니다.");
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer(),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
