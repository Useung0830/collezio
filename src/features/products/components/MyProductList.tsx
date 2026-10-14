"use client";

import { useState } from "react";

import Button from "@/components/common/button/Button";
import LinkButton from "@/components/common/button/LinkButton";
import ProductCard from "@/features/products/components/ProductCard";
import { useMyProductsQuery } from "@/features/products/hooks/useMyProductsQuery";
import type { ProductStatus } from "@/features/products/types/product";

import PlusIcon from "@/assets/icons/icon-plus.svg";

type ProductFilter = "all" | ProductStatus;

const productFilters: { label: string; value: ProductFilter }[] = [
  { label: "전체", value: "all" },
  { label: "거래가능", value: "available" },
  { label: "예약중", value: "reserved" },
  { label: "거래완료", value: "completed" },
];

export default function MyProductList() {
  const productsQuery = useMyProductsQuery();
  const [selectedFilter, setSelectedFilter] = useState<ProductFilter>("all");

  if (productsQuery.isAuthLoading) {
    return (
      <p role="status" className="text-body-16">
        로그인 상태를 확인하고 있습니다.
      </p>
    );
  }

  if (!productsQuery.isLoggedIn) {
    return (
      <section className="flex flex-col items-start gap-4">
        <h2 className="text-heading-20">보유품 목록</h2>
        <p className="text-body-16">
          로그인하면 내가 등록한 상품을 확인할 수 있습니다.
        </p>
        <LinkButton href="/login" variant="blue">
          로그인
        </LinkButton>
      </section>
    );
  }

  const products = productsQuery.data ?? [];
  const filteredProducts =
    selectedFilter === "all"
      ? products
      : products.filter((product) => product.status === selectedFilter);

  return (
    <section aria-labelledby="my-products-title" className="text-black-900">
      <div className="flex items-center justify-between gap-4">
        <h2 id="my-products-title" className="text-heading-20">
          보유품 목록
          {productsQuery.isSuccess && (
            <span className="text-black-600 ml-2">{products.length}</span>
          )}
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

      {productsQuery.isPending ? (
        <p role="status" className="text-body-16 mt-6">
          {productsQuery.isPaused
            ? "인터넷 연결을 확인해주세요."
            : "보유품을 불러오고 있습니다."}
        </p>
      ) : productsQuery.isError ? (
        <div className="mt-6 flex flex-col items-start gap-3">
          <p role="alert" className="text-body-16">
            보유품을 불러오지 못했습니다. 다시 시도해주세요.
          </p>
          <Button
            onClick={() => void productsQuery.refetch()}
            disabled={productsQuery.isFetching}
          >
            다시 시도
          </Button>
        </div>
      ) : (
        <>
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
                    : products.filter(
                        (product) => product.status === filter.value,
                      ).length;

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
        </>
      )}
    </section>
  );
}
