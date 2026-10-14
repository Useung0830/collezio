"use client";

import Button from "@/components/common/button/Button";
import LinkButton from "@/components/common/button/LinkButton";
import { useFavoriteProductsQuery } from "@/features/favorite/hooks/useFavoriteProductsQuery";
import ProductCard from "@/features/products/components/ProductCard";

export default function FavoriteProductList() {
  const productsQuery = useFavoriteProductsQuery();
  const products = productsQuery.data ?? [];

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
        {productsQuery.isLoggedIn && productsQuery.isSuccess && (
          <span className="text-black-600 ml-2">{products.length}</span>
        )}
      </h2>

      {productsQuery.isAuthLoading ? (
        <p role="status" className="text-body-16 mt-6">
          로그인 상태를 확인하고 있습니다.
        </p>
      ) : !productsQuery.isLoggedIn ? (
        <div className="mt-6 flex flex-col items-start gap-3">
          <p className="text-body-16">
            로그인하면 찜한 상품을 확인할 수 있습니다.
          </p>
          <LinkButton href="/login" variant="blue">
            로그인
          </LinkButton>
        </div>
      ) : productsQuery.isPending ? (
        <p role="status" className="text-body-16 mt-6">
          {productsQuery.isPaused
            ? "인터넷 연결을 확인해주세요."
            : "찜한 상품을 불러오고 있습니다."}
        </p>
      ) : productsQuery.isError ? (
        <div className="mt-6 flex flex-col items-start gap-3">
          <p role="alert" className="text-body-16">
            찜한 상품을 불러오지 못했습니다. 다시 시도해주세요.
          </p>
          <Button
            disabled={productsQuery.isFetching}
            onClick={() => void productsQuery.refetch()}
          >
            다시 시도
          </Button>
        </div>
      ) : products.length === 0 ? (
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
