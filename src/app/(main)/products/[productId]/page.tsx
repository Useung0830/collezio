import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getProductMetadata } from "@/features/products/api/getProductMetadata";
import RegisteredProductDetail from "@/features/products/components/RegisteredProductDetail";

const fallbackMetadata: Metadata = {
  title: "상품 상세",
  description:
    "소장품의 사진과 상세 정보를 확인하고 교환을 위한 대화를 시작해보세요.",
};

export async function generateMetadata(
  props: PageProps<"/products/[productId]">,
): Promise<Metadata> {
  const { productId } = await props.params;
  try {
    const product = await getProductMetadata(productId);
    if (!product) return { ...fallbackMetadata, robots: { index: false } };
    return {
      title: product.title,
      description: product.description || fallbackMetadata.description,
    };
  } catch {
    // 메타데이터 조회 장애가 기존 상세 화면까지 막지 않도록 기본 문구를 사용합니다.
    return fallbackMetadata;
  }
}

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
