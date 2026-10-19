"use client";

import Link from "next/link";

import Button from "@/components/common/button/Button";
import ProductCard from "@/features/products/components/ProductCard";
import type { ProductCategory } from "@/features/products/constants/productCategories";
import { PRODUCT_CATEGORIES } from "@/features/products/constants/productCategories";
import { useSearchProductsQuery } from "@/features/products/hooks/useSearchProductsQuery";
import { normalizeProductSearch } from "@/features/products/utils/normalizeProductSearch";

type SearchProductResultsProps = {
  category: ProductCategory | null;
  searchText: string;
};

function getSearchHref(searchText: string, category: ProductCategory | null) {
  const params = new URLSearchParams();
  if (searchText) params.set("query", searchText);
  if (category) params.set("category", category);
  return `/search${params.size ? `?${params.toString()}` : ""}`;
}

export default function SearchProductResults({
  category,
  searchText,
}: SearchProductResultsProps) {
  const normalizedSearch = normalizeProductSearch(searchText);
  const hasInvalidSearchText = Boolean(searchText) && !normalizedSearch;
  const hasTooManyWords =
    normalizedSearch.split(" ").filter(Boolean).length > 4;
  const productsQuery = useSearchProductsQuery(
    category,
    searchText,
    !hasTooManyWords && !hasInvalidSearchText,
  );
  const products =
    productsQuery.data?.pages.flatMap((page) => page.products) ?? [];

  return (
    <main className="text-black-900 mx-auto w-full max-w-280 pb-20">
      <h1 className="text-heading-24 mb-4">
        {searchText ? `‘${searchText}’ 검색 결과` : "상품 둘러보기"}
      </h1>
      <form action="/search" role="search" className="mb-6 flex gap-2">
        {category && <input type="hidden" name="category" value={category} />}
        <input
          type="search"
          name="query"
          defaultValue={searchText}
          maxLength={100}
          aria-label="상품 제목 검색어"
          placeholder="상품 제목의 단어를 입력해주세요"
          className="border-black-300 text-body-16 text-black-900 min-w-0 flex-1 rounded-xl border px-4 py-3"
        />
        <Button type="submit">검색</Button>
      </form>
      <nav aria-label="상품 카테고리" className="mb-8 flex flex-wrap gap-2">
        <Link
          href={getSearchHref(searchText, null)}
          aria-current={category === null ? "page" : undefined}
          className={`text-label-14 rounded-full border px-4 py-2 ${category === null ? "border-black-900 bg-black-900 text-white" : "border-black-300 text-black-900"}`}
        >
          전체
        </Link>
        {PRODUCT_CATEGORIES.map((item) => (
          <Link
            key={item.value}
            href={getSearchHref(searchText, item.value)}
            aria-current={category === item.value ? "page" : undefined}
            className={`text-label-14 rounded-full border px-4 py-2 ${category === item.value ? "border-black-900 bg-black-900 text-white" : "border-black-300 text-black-900"}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {hasInvalidSearchText ? (
        <p role="alert" className="text-body-16 py-10 text-center">
          검색어에 글자 또는 숫자를 입력해주세요.
        </p>
      ) : hasTooManyWords ? (
        <p role="alert" className="text-body-16 py-10 text-center">
          검색어는 네 단어 이하로 입력해주세요.
        </p>
      ) : productsQuery.isPending ? (
        <p role="status" className="text-body-16 py-10 text-center">
          상품을 불러오고 있습니다.
        </p>
      ) : productsQuery.isError ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <p role="alert" className="text-body-16">
            상품을 불러오지 못했습니다. 다시 시도해주세요.
          </p>
          <Button onClick={() => void productsQuery.refetch()}>
            다시 시도
          </Button>
        </div>
      ) : products.length === 0 ? (
        <p role="status" className="text-body-16 py-10 text-center">
          조건에 맞는 상품이 없습니다.
        </p>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
          {productsQuery.hasNextPage && (
            <div className="mt-10 flex justify-center">
              <Button
                disabled={productsQuery.isFetchingNextPage}
                onClick={() => void productsQuery.fetchNextPage()}
              >
                {productsQuery.isFetchingNextPage ? "불러오는 중..." : "더보기"}
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
