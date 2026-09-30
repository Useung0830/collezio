export function getCommunityImagePaths(
  images: unknown,
  authorId: string,
  postId: string,
): string[] {
  if (!Array.isArray(images) || images.length > 10)
    throw new Error("사진 정보를 확인할 수 없습니다.");
  return images.map((image: unknown) => {
    if (
      typeof image !== "object" ||
      image === null ||
      !("path" in image) ||
      typeof image.path !== "string"
    )
      throw new Error("사진 경로를 확인할 수 없습니다.");
    const parts = image.path.split("/");
    if (
      parts.length !== 4 ||
      parts[0] !== "community" ||
      parts[1] !== authorId ||
      parts[2] !== postId ||
      !/^[a-zA-Z0-9-]+$/.test(parts[3])
    )
      throw new Error("사진 경로를 확인할 수 없습니다.");
    return image.path;
  });
}
