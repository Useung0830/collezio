import { getPublicFirestoreTextFields } from "@/lib/getPublicFirestoreTextFields";

import { formatMetadataText } from "@/utils/formatMetadataText";

export async function getProductMetadata(productId: string) {
  const fields = await getPublicFirestoreTextFields({
    collection: "products",
    documentId: productId,
    fields: ["title", "description"],
  });
  if (!fields) return null;

  const title = formatMetadataText(fields.title ?? "", 100);
  if (!title) return null;

  return {
    title,
    description: formatMetadataText(fields.description ?? "", 160),
  };
}
