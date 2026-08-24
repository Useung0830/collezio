import ProductCard from "@/features/products/components/ProductCard";
import { popularProducts } from "@/features/products/mocks/products";

export default function PopularProductList() {
  return (
    <section>
      <div>
        <h2 className="text-heading-24 text-black-900 mb-6">인기상품</h2>
        <ul className="grid grid-cols-4 gap-3">
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
