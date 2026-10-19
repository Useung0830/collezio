"use client";

import { useFavoriteProductsQuery } from "@/features/favorite/hooks/useFavoriteProductsQuery";
import ProductCard from "@/features/products/components/ProductCard";

type FavoriteProductListProps = {
  userId: string;
};

export default function FavoriteProductList({
  userId,
}: FavoriteProductListProps) {
  const { data: products } = useFavoriteProductsQuery(userId);

  return (
    <section
      aria-labelledby="favorite-products-title"
      className="text-black-900"
    >
      <h2
        id="favorite-products-title"
        className="text-heading-20 text-black-900"
      >
        찜한 컬렉션
        <span className="text-black-600 ml-2">{products.length}</span>
      </h2>

      {products.length === 0 ? (
        <p
          role="status"
          className="text-body-16 text-black-600 py-10 text-center"
        >
          아직 찜한 상품이 없습니다.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <li key={product.id} className="min-w-0">
              <ProductCard product={product} size="compact" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
