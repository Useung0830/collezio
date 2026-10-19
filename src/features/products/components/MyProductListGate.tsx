"use client";

import dynamic from "next/dynamic";

import LinkButton from "@/components/common/button/LinkButton";
import QuerySuspenseBoundary from "@/components/common/QuerySuspenseBoundary";
import ProductGridSkeleton from "@/features/products/components/ProductGridSkeleton";
import ProductLoadError from "@/features/products/components/ProductLoadError";
import { useProfileUserId } from "@/features/user/hooks/useProfileUserId";

const MyProductList = dynamic(
  () => import("@/features/products/components/MyProductList"),
  {
    ssr: false,
    loading: () => <ProductGridSkeleton count={8} title="보유품 목록" />,
  },
);

export default function MyProductListGate() {
  const userId = useProfileUserId();

  if (userId === undefined) {
    return <ProductGridSkeleton count={8} title="보유품 목록" />;
  }
  if (!userId) {
    return (
      <section className="flex flex-col items-start gap-4">
        <h2 className="text-heading-20">보유품 목록</h2>
        <p className="text-body-16">
          로그인하면 내가 등록한 상품을 확인할 수 있습니다.
        </p>
        <LinkButton href="/login" variant="blue">
          로그인
        </LinkButton>
      </section>
    );
  }

  return (
    <QuerySuspenseBoundary
      key={userId}
      fallback={<ProductGridSkeleton count={8} title="보유품 목록" />}
      renderError={(error, retry) => (
        <ProductLoadError
          error={error}
          message="보유품을 불러오지 못했습니다. 다시 시도해주세요."
          onRetry={retry}
          title="보유품 목록"
        />
      )}
    >
      <MyProductList userId={userId} />
    </QuerySuspenseBoundary>
  );
}
