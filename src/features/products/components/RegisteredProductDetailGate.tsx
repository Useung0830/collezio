"use client";

import dynamic from "next/dynamic";

import QuerySuspenseBoundary from "@/components/common/QuerySuspenseBoundary";
import ProductDetailSkeleton from "@/features/products/components/ProductDetailSkeleton";
import ProductLoadError from "@/features/products/components/ProductLoadError";
import { useProfileUserId } from "@/features/user/hooks/useProfileUserId";

const RegisteredProductDetail = dynamic(
  () => import("@/features/products/components/RegisteredProductDetail"),
  {
    ssr: false,
    loading: () => <ProductDetailSkeleton />,
  },
);

type RegisteredProductDetailGateProps = {
  productId: string;
};

export default function RegisteredProductDetailGate({
  productId,
}: RegisteredProductDetailGateProps) {
  const userId = useProfileUserId();

  if (userId === undefined) return <ProductDetailSkeleton />;

  return (
    <QuerySuspenseBoundary
      key={`${productId}:${userId ?? "guest"}`}
      fallback={<ProductDetailSkeleton />}
      renderError={(error, retry) => (
        <ProductLoadError
          error={error}
          message="상품 정보를 불러오지 못했습니다. 다시 시도해주세요."
          onRetry={retry}
        />
      )}
    >
      <RegisteredProductDetail productId={productId} userId={userId} />
    </QuerySuspenseBoundary>
  );
}
