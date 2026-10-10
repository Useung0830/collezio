import { getPublicFirestoreFields } from "@/lib/getPublicFirestoreFields";

import { formatMetadataText } from "@/utils/formatMetadataText";
import { getShareImageUrl } from "@/utils/getShareImageUrl";

export async function getProductMetadata(productId: string) {
  const fields = await getPublicFirestoreFields({
    collection: "products",
    documentId: productId,
    fields: ["title", "description", "images", "sellerId"],
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
      typeof fields.description === "string" ? fields.description : "",
      160,
    ),
    imageUrl: getShareImageUrl({
      images: fields.images,
      bucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      pathPrefix:
        typeof fields.sellerId === "string" &&
        fields.sellerId &&
        !fields.sellerId.includes("/")
          ? `products/${fields.sellerId}/`
          : null,
    }),
  };
}
