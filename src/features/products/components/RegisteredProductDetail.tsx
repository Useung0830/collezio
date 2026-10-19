"use client";

import LinkButton from "@/components/common/button/LinkButton";
import RegisteredProductInfo from "@/features/products/components/RegisteredProductInfo";
import { useProductDetailQuery } from "@/features/products/hooks/useProductDetailQuery";

interface RegisteredProductDetailProps {
  productId: string;
  userId: string | null;
}

export default function RegisteredProductDetail({
  productId,
  userId,
}: RegisteredProductDetailProps) {
  const { data: product } = useProductDetailQuery(productId, userId);

  if (!product) {
    return (
      <div className="text-black-900 flex flex-col items-start gap-4">
        <h1 className="text-heading-24">상품을 찾을 수 없습니다.</h1>
        <p className="text-body-16">삭제되었거나 존재하지 않는 상품입니다.</p>
        <LinkButton href="/collections">보유품 목록으로</LinkButton>
      </div>
    );
  }

  return <RegisteredProductInfo product={product} />;
}
