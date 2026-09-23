"use client";

import { useState } from "react";

import Button from "@/components/common/button/Button";
import ProductCard from "@/features/products/components/ProductCard";
import { useNewProductsQuery } from "@/features/products/hooks/useNewProductsQuery";

const INITIAL_VISIBLE_PRODUCT_COUNT = 10;
const PRODUCT_LOAD_COUNT = 10;

export default function NewProductList() {
  const productsQuery = useNewProductsQuery();
  const [visibleProductCount, setVisibleProductCount] = useState(
    INITIAL_VISIBLE_PRODUCT_COUNT,
  );

  const products = productsQuery.data ?? [];
  const visibleProducts = products.slice(0, visibleProductCount);
  const hasMoreProducts = visibleProductCount < products.length;

  const handleLoadMore = () => {
    setVisibleProductCount((currentCount) =>
      Math.min(currentCount + PRODUCT_LOAD_COUNT, products.length),
    );
  };

  return (
    <section aria-labelledby="new-products-title" className="text-black-900">
      <h2 id="new-products-title" className="text-heading-24 mb-4 md:mb-6">
        NEW
      </h2>
      {productsQuery.isPending ? (
        <p role="status" className="text-body-16 py-10 text-center">
          {productsQuery.isPaused
            ? "인터넷 연결을 확인해주세요."
            : "상품을 불러오고 있습니다."}
        </p>
      ) : productsQuery.isError ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <p role="alert" className="text-body-16">
            상품을 불러오지 못했습니다. 다시 시도해주세요.
          </p>
          <Button
            onClick={() => void productsQuery.refetch()}
            disabled={productsQuery.isFetching}
          >
            다시 시도
          </Button>
        </div>
      ) : products.length === 0 ? (
        <p
          role="status"
          className="text-body-16 text-black-600 py-10 text-center"
        >
          아직 등록된 상품이 없습니다.
        </p>
      ) : (
        <>
          <ul
            id="new-product-list"
            className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-y-13"
          >
            {visibleProducts.map((product) => (
              <li key={product.id} className="min-w-0">
                <ProductCard product={product} size="compact" />
              </li>
            ))}
          </ul>

          {hasMoreProducts && (
            <div className="mt-10 flex justify-center md:mt-12">
              <Button
                className="w-full max-w-80"
                aria-controls="new-product-list"
                onClick={handleLoadMore}
              >
                더보기
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
