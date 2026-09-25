import ProductCard from "@/features/products/components/ProductCard";
import ProductShowcaseEmptySlots from "@/features/products/components/ProductShowcaseEmptySlots";
import { popularProducts } from "@/features/products/mocks/products";

import styles from "./productShowcase.module.css";

export default function PopularProductList() {
  return (
    <section>
      <div>
        <h2 className="text-heading-24 text-black-900 mb-4 md:mb-6">
          인기상품
        </h2>
        <ul
          className={`${styles.cabinet} ${styles.openShowcase} grid grid-cols-2 md:grid-cols-4`}
        >
          {popularProducts.map((product) => (
            <li key={product.id} className={styles.compartment}>
              <ProductCard product={product} appearance="showcase" />
            </li>
          ))}
          <ProductShowcaseEmptySlots productCount={popularProducts.length} />
        </ul>
      </div>
    </section>
  );
}
