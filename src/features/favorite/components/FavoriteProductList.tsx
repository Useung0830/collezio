import ProductCard from "@/features/products/components/ProductCard";
import { products } from "@/features/products/mocks/products";

const favoriteProducts = products.slice(0, 8);

export default function FavoriteProductList() {
  return (
    <section aria-labelledby="favorite-products-title">
      <h2
        id="favorite-products-title"
        className="text-heading-20 text-black-900"
      >
        찜한 컬렉션
        <span className="text-black-600 ml-2">{favoriteProducts.length}</span>
      </h2>

      <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
        {favoriteProducts.map((product) => (
          <li key={product.id} className="min-w-0">
            <ProductCard product={product} size="compact" />
          </li>
        ))}
      </ul>
    </section>
  );
}
