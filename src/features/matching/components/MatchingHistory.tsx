import LinkButton from "@/components/common/button/LinkButton";
import ProductCard from "@/features/products/components/ProductCard";
import { products } from "@/features/products/mocks/products";

import PlusIcon from "@/assets/icons/icon-plus.svg";

const matchingProducts = [products[1], products[6], products[0], products[2]];

const matchingFilters = [
  { label: "전체", count: 4, isActive: true },
  { label: "거래가능", count: 1, isActive: false },
  { label: "예약중", count: 1, isActive: false },
  { label: "거래완료", count: 2, isActive: false },
];

export default function MatchingHistory() {
  return (
    <section aria-labelledby="matching-history-title">
      <div className="flex items-center justify-between gap-4">
        <h2
          id="matching-history-title"
          className="text-heading-20 text-black-900"
        >
          매칭 내역 <span className="text-black-600 ml-2">4</span>
        </h2>
        <LinkButton
          href="/products/new"
          variant="green"
          size="compact"
          shape="square"
        >
          <PlusIcon className="size-4" aria-hidden="true" />
          상품 등록
        </LinkButton>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="border-black-200 flex min-w-max gap-1 border-b">
          {matchingFilters.map((filter) => (
            <button
              key={filter.label}
              className={`text-body-16 relative px-4 pb-3 ${
                filter.isActive ? "text-black-900" : "text-black-600"
              }`}
            >
              {filter.label} {filter.count}
              {filter.isActive && (
                <span className="bg-black-900 absolute inset-x-4 bottom-0 h-px" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {matchingProducts.map((product) => (
          <ProductCard key={product.id} product={product} size="compact" />
        ))}
      </div>
    </section>
  );
}
