type ShareImageInput = {
  images: unknown;
  bucket: string | undefined;
  pathPrefix: string | null;
};

export function getShareImageUrl({
  images,
  bucket,
  pathPrefix,
}: ShareImageInput) {
  if (!Array.isArray(images) || images.length > 10 || !bucket || !pathPrefix)
    return null;

  for (const image of images) {
    if (
      typeof image !== "object" ||
      image === null ||
      typeof image.path !== "string" ||
      typeof image.url !== "string" ||
      !image.path.startsWith(pathPrefix) ||
      !/^[a-zA-Z0-9-]{1,64}$/.test(image.path.slice(pathPrefix.length))
    )
      continue;

    try {
      const url = new URL(image.url);
      if (
        url.origin !== "https://firebasestorage.googleapis.com" ||
        url.username ||
        url.password ||
        url.hash ||
        url.pathname !==
          `/v0/b/${bucket}/o/${encodeURIComponent(image.path)}` ||
        url.searchParams.get("alt") !== "media" ||
        [...url.searchParams.keys()].some(
          (key) => key !== "alt" && key !== "token",
        )
      )
        continue;
      return url.toString();
    } catch {
      continue;
    }
  }
  return null;
}
