"use client";

import { useEffect, useRef, useState } from "react";
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
  const newProductsRef = useRef<HTMLDivElement>(null);
  const [shouldLoadNewProducts, setShouldLoadNewProducts] = useState(false);

  useEffect(() => {
    if (shouldLoadNewProducts || !newProductsRef.current) return;

    if (!("IntersectionObserver" in window)) {
      const timeout = setTimeout(() => setShouldLoadNewProducts(true), 0);
      return () => clearTimeout(timeout);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoadNewProducts(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px" },
    );
    observer.observe(newProductsRef.current);

    return () => observer.disconnect();
  }, [shouldLoadNewProducts]);

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
      <div ref={newProductsRef}>
        {shouldLoadNewProducts ? (
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
        ) : (
          <ProductGridSkeleton
            count={10}
            title="NEW"
            variant="compact-showcase"
          />
        )}
      </div>
    </>
  );
}
