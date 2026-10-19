"use client";

import dynamic from "next/dynamic";

import LinkButton from "@/components/common/button/LinkButton";
import QuerySuspenseBoundary from "@/components/common/QuerySuspenseBoundary";
import ProductGridSkeleton from "@/features/products/components/ProductGridSkeleton";
import ProductLoadError from "@/features/products/components/ProductLoadError";
import { useProfileUserId } from "@/features/user/hooks/useProfileUserId";

const FavoriteProductList = dynamic(
  () => import("@/features/favorite/components/FavoriteProductList"),
  {
    ssr: false,
    loading: () => <ProductGridSkeleton count={8} title="찜한 컬렉션" />,
  },
);

export default function FavoriteProductListGate() {
  const userId = useProfileUserId();

  if (userId === undefined) {
    return <ProductGridSkeleton count={8} title="찜한 컬렉션" />;
  }
  if (!userId) {
    return (
      <section className="text-black-900 flex flex-col items-start gap-3">
        <h2 className="text-heading-20">찜한 컬렉션</h2>
        <p className="text-body-16">
          로그인하면 찜한 상품을 확인할 수 있습니다.
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
      fallback={<ProductGridSkeleton count={8} title="찜한 컬렉션" />}
      renderError={(error, retry) => (
        <ProductLoadError
          error={error}
          message="찜한 상품을 불러오지 못했습니다. 다시 시도해주세요."
          onRetry={retry}
          title="찜한 컬렉션"
        />
      )}
    >
      <FavoriteProductList userId={userId} />
    </QuerySuspenseBoundary>
  );
}
