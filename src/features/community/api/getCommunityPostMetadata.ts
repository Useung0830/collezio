import { getPublicFirestoreFields } from "@/lib/getPublicFirestoreFields";

import { formatMetadataText } from "@/utils/formatMetadataText";
import { getShareImageUrl } from "@/utils/getShareImageUrl";

export async function getCommunityPostMetadata(postId: string) {
  const fields = await getPublicFirestoreFields({
    collection: "communityPosts",
    documentId: postId,
    fields: ["title", "content", "images", "authorId"],
  });
  if (!fields) return null;

  const title = formatMetadataText(
    typeof fields.title === "string" ? fields.title : "",
    100,
  );
  if (!title) return null;

  return {
    title,
    description: formatMetadataText(
      typeof fields.content === "string" ? fields.content : "",
      160,
    ),
    imageUrl: getShareImageUrl({
      images: fields.images,
      bucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      pathPrefix:
        typeof fields.authorId === "string" &&
        fields.authorId &&
        !fields.authorId.includes("/")
          ? `community/${fields.authorId}/${postId}/`
          : null,
    }),
  };
}
