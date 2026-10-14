"use client";

import { FirebaseError } from "firebase/app";

import Button from "@/components/common/button/Button";
import LinkButton from "@/components/common/button/LinkButton";
import RegisteredProductInfo from "@/features/products/components/RegisteredProductInfo";
import { useProductDetailQuery } from "@/features/products/hooks/useProductDetailQuery";

interface RegisteredProductDetailProps {
  productId: string;
}

export default function RegisteredProductDetail({
  productId,
}: RegisteredProductDetailProps) {
  const productQuery = useProductDetailQuery(productId);

  if (productQuery.isPending) {
    return (
      <p role="status" className="text-body-16 text-black-900">
        {productQuery.isPaused
          ? "인터넷 연결을 확인해주세요."
          : "상품 정보를 불러오고 있습니다."}
      </p>
    );
  }
  if (productQuery.isError) {
    const isPermissionDenied =
      productQuery.error instanceof FirebaseError &&
      productQuery.error.code === "permission-denied";
    return (
      <div className="text-black-900 flex flex-col items-start gap-4">
        <p role="alert" className="text-body-16">
          {isPermissionDenied
            ? "상품을 볼 권한이 없습니다. 로그인 상태를 확인해주세요."
            : "상품 정보를 불러오지 못했습니다. 다시 시도해주세요."}
        </p>
        <Button
          onClick={() => void productQuery.refetch()}
          disabled={productQuery.isFetching}
        >
          다시 시도
        </Button>
        {isPermissionDenied && <LinkButton href="/login">로그인</LinkButton>}
      </div>
    );
  }
  if (!productQuery.data) {
    return (
      <div className="text-black-900 flex flex-col items-start gap-4">
        <h1 className="text-heading-24">상품을 찾을 수 없습니다.</h1>
        <p className="text-body-16">삭제되었거나 존재하지 않는 상품입니다.</p>
        <LinkButton href="/collections">보유품 목록으로</LinkButton>
      </div>
    );
  }

  return <RegisteredProductInfo product={productQuery.data} />;
}
