import ProductCard from "@/features/products/components/ProductCard";
import { newProducts } from "@/features/products/mocks/products";

export default function NewProductList() {
  return (
    <section>
      <h2 className="text-heading-24 text-black-900 mb-6">NEW</h2>
      <ul className="grid grid-cols-5 gap-x-3 gap-y-13">
        {newProducts.map((product) => (
          <li key={product.id} className="min-w-0">
            <ProductCard product={product} size="compact" />
          </li>
        ))}
      </ul>
    </section>
  );
}
