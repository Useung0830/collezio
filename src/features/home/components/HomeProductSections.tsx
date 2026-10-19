"use client";

import dynamic from "next/dynamic";

import QuerySuspenseBoundary from "@/components/common/QuerySuspenseBoundary";
import ProductGridSkeleton from "@/features/products/components/ProductGridSkeleton";
import ProductLoadError from "@/features/products/components/ProductLoadError";

const PopularProductList = dynamic(
  () => import("@/features/products/components/PopularProductList"),
  {
    ssr: false,
    loading: () => (
      <ProductGridSkeleton count={4} title="인기상품" variant="showcase" />
    ),
  },
);
const NewProductList = dynamic(
  () => import("@/features/products/components/NewProductList"),
  {
    ssr: false,
    loading: () => (
      <ProductGridSkeleton count={10} title="NEW" variant="compact-showcase" />
    ),
  },
);

export default function HomeProductSections() {
  return (
    <>
      <QuerySuspenseBoundary
        fallback={
          <ProductGridSkeleton count={4} title="인기상품" variant="showcase" />
        }
        renderError={(error, retry) => (
          <ProductLoadError
            error={error}
            message="상품을 불러오지 못했습니다. 다시 시도해주세요."
            onRetry={retry}
            title="인기상품"
          />
        )}
      >
        <PopularProductList />
      </QuerySuspenseBoundary>
      <QuerySuspenseBoundary
        fallback={
          <ProductGridSkeleton
            count={10}
            title="NEW"
            variant="compact-showcase"
          />
        }
        renderError={(error, retry) => (
          <ProductLoadError
            error={error}
            message="상품을 불러오지 못했습니다. 다시 시도해주세요."
            onRetry={retry}
            title="NEW"
          />
        )}
      >
        <NewProductList />
      </QuerySuspenseBoundary>
    </>
  );
}
