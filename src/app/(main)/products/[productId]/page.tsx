import { notFound } from "next/navigation";

import RegisteredProductDetail from "@/features/products/components/RegisteredProductDetail";

export default async function ProductDetailPage(
  props: PageProps<"/products/[productId]">,
) {
  const { productId } = await props.params;
  if (
    !productId ||
    productId.includes("/") ||
    productId === "." ||
    productId === ".."
  ) {
    notFound();
  }

  return <RegisteredProductDetail productId={productId} />;
}
