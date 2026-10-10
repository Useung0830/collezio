import type { Metadata } from "next";
import { notFound } from "next/navigation";

import RegisteredProductDetail from "@/features/products/components/RegisteredProductDetail";

export const metadata: Metadata = {
  title: "상품 상세",
  description:
    "소장품의 사진과 상세 정보를 확인하고 교환을 위한 대화를 시작해보세요.",
};

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
