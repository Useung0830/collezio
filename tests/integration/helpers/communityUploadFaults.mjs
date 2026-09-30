import { uploadCommunityImage as uploadImage } from "../../../src/features/community/api/uploadCommunityImage.ts";

export const uploads = { paths: [], failAt: 0 };

export async function uploadCommunityImage(file, path) {
  uploads.paths.push(path);
  const image = await uploadImage(file, path);
  if (uploads.paths.length === uploads.failAt)
    throw new Error("업로드 후 응답 유실 테스트");
  return image;
}
