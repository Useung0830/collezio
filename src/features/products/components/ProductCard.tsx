import Image from "next/image";
import Link from "next/link";

import type { ProductListItem } from "@/features/products/types/product";

import formatRelativeTime from "@/utils/formatRelativeTime";

import ChatIcon from "@/assets/icons/icon-chat.svg";
import GalleryIcon from "@/assets/icons/icon-gallery.svg";
import HeartIcon from "@/assets/icons/icon-heart.svg";
import styles from "./productShowcase.module.css";

interface ProductCardProps {
  product: ProductListItem;
  size?: "default" | "compact";
  isLinked?: boolean;
  appearance?: "default" | "showcase";
}

export default function ProductCard({
  product,
  size = "default",
  isLinked = true,
  appearance = "default",
}: ProductCardProps) {
  const isShowcase = appearance === "showcase";
  const productImage = product.image;
  const isSale = product.transaction.type === "sale";
  const transactionColor = isSale ? "bg-brand-blue" : "bg-brand-green";

  const transactionLabel =
    product.transaction.type === "sale"
      ? `${product.transaction.price.toLocaleString("ko-KR")}원`
      : `${product.transaction.desiredItemName}`;

  const titleClassName =
    size === "compact"
      ? "text-body-14 sm:text-body-16"
      : "text-body-16 sm:text-body-18";

  const transactionClassName =
    size === "compact"
      ? "text-label-16 sm:text-heading-20"
      : "text-heading-20 sm:text-heading-24";

  const imageSizes =
    size === "compact"
      ? "(min-width: 1024px) 214px, (min-width: 640px) 33vw, 50vw"
      : "(min-width: 768px) 268px, 50vw";

  const content = (
    <article
      className={isShowcase ? styles.card : "flex flex-col gap-3 sm:gap-4"}
    >
      <div
        className={
          isShowcase
            ? styles.display
            : "relative aspect-square w-full overflow-hidden rounded-2xl"
        }
      >
        {isShowcase && (
          <>
            <span className={styles.interior} aria-hidden="true" />
            <span className={styles.reflection} aria-hidden="true" />
            {productImage && (
              <span className={styles.contactShadow} aria-hidden="true" />
            )}
          </>
        )}
        {productImage ? (
          <div className={isShowcase ? styles.imageMount : undefined}>
            <Image
              src={productImage}
              alt={product.title}
              fill
              sizes={imageSizes}
              className={isShowcase ? styles.productImage : "object-cover"}
            />
          </div>
        ) : (
          <div
            className={`text-black-600 flex h-full items-center justify-center ${isShowcase ? styles.placeholder : "bg-black-100"}`}
            role="img"
            aria-label="상품 사진 없음"
          >
            <GalleryIcon className="size-8" aria-hidden="true" />
          </div>
        )}
      </div>

      <div
        className={`flex flex-col gap-2 sm:gap-3 ${isShowcase ? styles.label : ""}`}
      >
        <h3 className={`${titleClassName} text-black-900`}>{product.title}</h3>
        <div className="flex items-center gap-1">
          <div
            className={`${transactionColor} flex items-center justify-center rounded-full px-2.5 py-1`}
          >
            <span className="text-label-16 whitespace-nowrap text-white">
              {isSale ? "판매" : "교환"}
            </span>
          </div>
          <p className={`${transactionClassName} flex-1 truncate`}>
            {transactionLabel}
          </p>
        </div>
        <div
          className={`text-caption-13 text-black-600 sm:text-body-16 flex items-center gap-2 ${isShowcase ? "flex-wrap" : ""}`}
        >
          <div className="flex gap-1">
            <div className="flex items-center gap-0.5">
              <HeartIcon className="size-4" />
              <span>{product.favoriteCount}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <ChatIcon className="size-4" />
              <span>{product.chatCount}</span>
            </div>
          </div>
          <p>{"\u00B7"}</p>
          <p>
            {product.createdAt
              ? formatRelativeTime(product.createdAt)
              : "등록일 확인 중"}
          </p>
        </div>
      </div>
    </article>
  );

  return isLinked ? (
    <Link
      href={`/products/${product.id}`}
      className={isShowcase ? styles.link : undefined}
    >
      {content}
    </Link>
  ) : (
    content
  );
}
