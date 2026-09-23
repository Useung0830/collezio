import ProductGallery from "@/features/products/components/ProductGallery";
import type { RegisteredProductDetail } from "@/features/products/types/product";

import formatRelativeTime from "@/utils/formatRelativeTime";

interface RegisteredProductInfoProps {
  product: RegisteredProductDetail;
}

export default function RegisteredProductInfo({
  product,
}: RegisteredProductInfoProps) {
  const isSale = product.transaction.type === "sale";

  return (
    <article className="text-black-900 m-auto flex w-full max-w-280 flex-col gap-6 md:flex-row md:gap-12">
      <ProductGallery
        key={product.id}
        title={product.title}
        imageUrls={product.imageUrls}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <header className="flex flex-col gap-3">
          <h1 className="text-heading-24 wrap-anywhere">{product.title}</h1>
          {product.createdAt && (
            <time
              className="text-label-16 text-black-400"
              dateTime={product.createdAt}
            >
              {formatRelativeTime(product.createdAt)}
            </time>
          )}
          <div className="flex items-start gap-2">
            <span
              className={`text-label-16 shrink-0 rounded-full px-2.5 py-1 text-white ${isSale ? "bg-brand-blue" : "bg-brand-green"}`}
            >
              {isSale ? "판매" : "교환"}
            </span>
            <p className="text-heading-24 min-w-0 wrap-anywhere">
              {product.transaction.type === "sale"
                ? `${product.transaction.price.toLocaleString("ko-KR")}원`
                : product.transaction.desiredItemName}
            </p>
          </div>
        </header>
        <section className="flex flex-col gap-3">
          <h2 className="text-heading-20">상품 설명</h2>
          <p className="text-body-18 leading-8 wrap-anywhere whitespace-pre-wrap">
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
      </div>
    </article>
  );
}
