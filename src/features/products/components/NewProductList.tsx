"use client";

import { useState } from "react";

import ProductCard from "@/features/products/components/ProductCard";
import { newProducts } from "@/features/products/mocks/products";

const INITIAL_VISIBLE_PRODUCT_COUNT = 10;
const PRODUCT_LOAD_COUNT = 10;

export default function NewProductList() {
  const [visibleProductCount, setVisibleProductCount] = useState(
    INITIAL_VISIBLE_PRODUCT_COUNT,
  );

  const visibleProducts = newProducts.slice(0, visibleProductCount);
  const hasMoreProducts = visibleProductCount < newProducts.length;

  const handleLoadMore = () => {
    setVisibleProductCount((currentCount) =>
      Math.min(currentCount + PRODUCT_LOAD_COUNT, newProducts.length),
    );
  };

  return (
    <section>
      <h2 className="text-heading-24 text-black-900 mb-4 md:mb-6">NEW</h2>
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
        <button
          type="button"
          className="border-black-300 text-label-16 text-black-900 hover:bg-black-50 mx-auto mt-10 flex w-full max-w-80 cursor-pointer items-center justify-center rounded-full border py-3 transition-colors md:mt-12"
          aria-controls="new-product-list"
          aria-expanded={!hasMoreProducts}
          onClick={handleLoadMore}
        >
          더보기
        </button>
      )}
    </section>
  );
}
