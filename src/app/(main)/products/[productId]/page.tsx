import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getProductMetadata } from "@/features/products/api/getProductMetadata";
import RegisteredProductDetail from "@/features/products/components/RegisteredProductDetail";

import { createShareMetadata } from "@/lib/createShareMetadata";

const fallbackMetadata = {
  title: "상품 상세",
  description:
    "소장품의 사진과 상세 정보를 확인하고 교환을 위한 대화를 시작해보세요.",
};

export async function generateMetadata(
  props: PageProps<"/products/[productId]">,
): Promise<Metadata> {
  const { productId } = await props.params;
  const shareOptions = {
    ...fallbackMetadata,
    path: `/products/${encodeURIComponent(productId)}`,
    type: "website" as const,
  };
  try {
    const product = await getProductMetadata(productId);
    if (!product)
      return createShareMetadata({ ...shareOptions, noindex: true });
    return createShareMetadata({
      ...shareOptions,
      title: product.title,
      description: product.description || fallbackMetadata.description,
      imageUrl: product.imageUrl,
    });
  } catch {
    // 메타데이터 조회 장애가 기존 상세 화면까지 막지 않도록 기본 문구를 사용합니다.
    return createShareMetadata(shareOptions);
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
