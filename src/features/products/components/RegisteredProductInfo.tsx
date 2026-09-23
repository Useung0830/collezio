import ProductGallery from "@/features/products/components/ProductGallery";
import RegisteredProductActions from "@/features/products/components/RegisteredProductActions";
import type { RegisteredProductDetail } from "@/features/products/types/product";
import PublicProfileCard from "@/features/user/components/PublicProfileCard";

import formatRelativeTime from "@/utils/formatRelativeTime";

import KebabIcon from "@/assets/icons/icon-kebab.svg";

interface RegisteredProductInfoProps {
  product: RegisteredProductDetail;
}

export default function RegisteredProductInfo({
  product,
}: RegisteredProductInfoProps) {
  const isSale = product.transaction.type === "sale";

  return (
    <article className="text-black-900 m-auto flex w-full max-w-280 flex-col gap-6 md:flex-row md:gap-12">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <ProductGallery
          key={product.id}
          title={product.title}
          imageUrls={product.imageUrls}
        />
        <section aria-label="판매자 프로필">
          {product.sellerId ? (
            <PublicProfileCard userId={product.sellerId} />
          ) : (
            <p className="text-body-16">판매자 정보를 확인할 수 없습니다.</p>
          )}
        </section>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <h1 className="text-heading-24 wrap-anywhere">{product.title}</h1>
            {product.createdAt && (
              <time
                className="text-label-16 text-black-400"
                dateTime={product.createdAt}
              >
                {formatRelativeTime(product.createdAt)}
              </time>
            )}
            <div className="flex items-center gap-2">
              <span
                className={`text-label-16 shrink-0 rounded-full px-2.5 py-1 text-white ${isSale ? "bg-brand-blue" : "bg-brand-green"}`}
              >
                {isSale ? "판매" : "교환"}
              </span>
              <p className="text-heading-24 min-w-0 flex-1 wrap-anywhere">
                {product.transaction.type === "sale"
                  ? `${product.transaction.price.toLocaleString("ko-KR")}원`
                  : product.transaction.desiredItemName}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled
            aria-label="상품 더보기 (준비 중)"
            title="준비 중"
            className="text-black-400 shrink-0 cursor-not-allowed"
          >
            <KebabIcon className="size-6" aria-hidden="true" />
          </button>
        </header>
        <section aria-label="상품 설명" className="text-body-18">
          <p className="leading-10 wrap-anywhere whitespace-pre-wrap">
            {product.description}
          </p>
        </section>
        <section className="border-black-200 flex flex-col gap-3 border-t pt-6">
          <h2 className="text-heading-20">거래 방법</h2>
          <dl className="text-body-16 flex flex-col gap-2">
            <div className="flex gap-3">
              <dt className="text-black-600 shrink-0">거래 방식</dt>
              <dd>
                {product.delivery.type === "direct" ? "직거래" : "택배 거래"}
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-black-600 shrink-0">
                {product.delivery.type === "direct" ? "거래 장소" : "배송비"}
              </dt>
              <dd className="wrap-anywhere whitespace-pre-wrap">
                {product.delivery.type === "direct"
                  ? product.delivery.location
                  : product.delivery.shippingFee === 0
                    ? "무료배송"
                    : `${product.delivery.shippingFee.toLocaleString("ko-KR")}원`}
              </dd>
            </div>
          </dl>
        </section>
        <RegisteredProductActions
          transactionType={product.transaction.type}
          favoriteCount={product.favoriteCount}
          chatCount={product.chatCount}
        />
      </div>
    </article>
  );
}
