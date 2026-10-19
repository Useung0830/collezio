"use client";

import ProductCard from "@/features/products/components/ProductCard";
import ProductShowcaseEmptySlots from "@/features/products/components/ProductShowcaseEmptySlots";
import { usePopularProductsQuery } from "@/features/products/hooks/usePopularProductsQuery";

import styles from "./productShowcase.module.css";

export default function PopularProductList() {
  const { data: products } = usePopularProductsQuery();

  return (
    <section
      aria-labelledby="popular-products-title"
      className="text-black-900"
    >
      <h2 id="popular-products-title" className="text-heading-24 mb-4 md:mb-6">
        인기상품
      </h2>
      {products.length === 0 ? (
        <p
          role="status"
          className="text-body-16 text-black-600 py-10 text-center"
        >
          아직 등록된 상품이 없습니다.
        </p>
      ) : (
        <ul
          className={`${styles.cabinet} ${styles.openShowcase} grid grid-cols-2 md:grid-cols-4`}
        >
          {products.map((product) => (
            <li key={product.id} className={styles.compartment}>
              <ProductCard product={product} appearance="showcase" />
            </li>
          ))}
          <ProductShowcaseEmptySlots productCount={products.length} />
        </ul>
      )}
    </section>
  );
}
