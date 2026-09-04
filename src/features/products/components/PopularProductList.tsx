import ProductCard from "@/features/products/components/ProductCard";
import { popularProducts } from "@/features/products/mocks/products";

export default function PopularProductList() {
  return (
    <section>
      <div>
        <h2 className="text-heading-24 text-black-900 mb-4 md:mb-6">
          인기상품
        </h2>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 lg:gap-4">
          {popularProducts.map((product) => (
            <li key={product.id} className="min-w-0">
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
