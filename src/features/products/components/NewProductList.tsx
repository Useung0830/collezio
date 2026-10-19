"use client";

import { useState } from "react";

import Button from "@/components/common/button/Button";
import ProductCard from "@/features/products/components/ProductCard";
import ProductShowcaseEmptySlots from "@/features/products/components/ProductShowcaseEmptySlots";
import { useNewProductsQuery } from "@/features/products/hooks/useNewProductsQuery";

import styles from "./productShowcase.module.css";

const INITIAL_VISIBLE_PRODUCT_COUNT = 10;
const PRODUCT_LOAD_COUNT = 10;

export default function NewProductList() {
  const { data: products } = useNewProductsQuery();
  const [visibleProductCount, setVisibleProductCount] = useState(
    INITIAL_VISIBLE_PRODUCT_COUNT,
  );

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
      {products.length === 0 ? (
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
            className={`${styles.cabinet} ${styles.openShowcase} grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`}
          >
            {visibleProducts.map((product) => (
              <li key={product.id} className={styles.compartment}>
                <ProductCard
                  product={product}
                  size="compact"
                  appearance="showcase"
                />
              </li>
            ))}
            <ProductShowcaseEmptySlots
              productCount={visibleProducts.length}
              size="compact"
            />
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
