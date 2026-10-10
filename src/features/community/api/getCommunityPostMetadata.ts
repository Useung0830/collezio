import { getPublicFirestoreTextFields } from "@/lib/getPublicFirestoreTextFields";

import { formatMetadataText } from "@/utils/formatMetadataText";

export async function getCommunityPostMetadata(postId: string) {
  const fields = await getPublicFirestoreTextFields({
    collection: "communityPosts",
    documentId: postId,
    fields: ["title", "content"],
  });
  if (!fields) return null;

  const title = formatMetadataText(fields.title ?? "", 100);
  if (!title) return null;

  return {
    title,
    description: formatMetadataText(fields.content ?? "", 160),
  };
}
