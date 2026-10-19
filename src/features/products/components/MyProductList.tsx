"use client";

import { useState } from "react";

import LinkButton from "@/components/common/button/LinkButton";
import ProductCard from "@/features/products/components/ProductCard";
import { useMyProductsQuery } from "@/features/products/hooks/useMyProductsQuery";
import type { ProductStatus } from "@/features/products/types/product";

import PlusIcon from "@/assets/icons/icon-plus.svg";

type MyProductListProps = {
  userId: string;
};

type ProductFilter = "all" | ProductStatus;

const productFilters: { label: string; value: ProductFilter }[] = [
  { label: "전체", value: "all" },
  { label: "거래가능", value: "available" },
  { label: "예약중", value: "reserved" },
  { label: "거래완료", value: "completed" },
];

export default function MyProductList({ userId }: MyProductListProps) {
  const { data: products } = useMyProductsQuery(userId);
  const [selectedFilter, setSelectedFilter] = useState<ProductFilter>("all");
  const filteredProducts =
    selectedFilter === "all"
      ? products
      : products.filter((product) => product.status === selectedFilter);

  return (
    <section aria-labelledby="my-products-title" className="text-black-900">
      <div className="flex items-center justify-between gap-4">
        <h2 id="my-products-title" className="text-heading-20">
          보유품 목록
          <span className="text-black-600 ml-2">{products.length}</span>
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
        <div
          role="group"
          aria-label="거래 상태 필터"
          className="border-black-200 flex min-w-max gap-1 border-b"
        >
          {productFilters.map((filter) => {
            const isActive = selectedFilter === filter.value;
            const count =
              filter.value === "all"
                ? products.length
                : products.filter((product) => product.status === filter.value)
                    .length;

            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={isActive}
                className={`text-body-16 relative px-4 pb-3 ${isActive ? "text-black-900" : "text-black-600"}`}
                onClick={() => setSelectedFilter(filter.value)}
              >
                {filter.label} {count}
                {isActive && (
                  <span className="bg-black-900 absolute inset-x-4 bottom-0 h-px" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      {filteredProducts.length === 0 ? (
        <p
          role="status"
          className="text-body-16 text-black-600 py-10 text-center"
        >
          {products.length === 0
            ? "아직 등록한 상품이 없습니다. 첫 상품을 등록해보세요."
            : "선택한 거래 상태의 상품이 없습니다."}
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-8 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <li key={product.id} className="min-w-0">
              <ProductCard product={product} size="compact" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
