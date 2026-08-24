import Image from "next/image";

import type { ProductListItem } from "@/features/products/types/product";

import formatRelativeTime from "@/utils/formatRelativeTime";

import ChatIcon from "@/assets/icons/icon_chat.svg";
import HeartIcon from "@/assets/icons/icon_heart.svg";

interface ProductCardProps {
  product: ProductListItem;
  size?: "default" | "compact";
}

export default function ProductCard({
  product,
  size = "default",
}: ProductCardProps) {
  const isSale = product.transaction.type === "sale";
  const transactionColor = isSale ? "bg-brand-blue" : "bg-brand-green";

  const transactionLabel =
    product.transaction.type === "sale"
      ? `${product.transaction.price}원`
      : `${product.transaction.desiredItemName}`;

  const titleClassName = size === "compact" ? "text-body-16" : "text-body-18";

  const transactionClassName =
    size === "compact" ? "text-heading-20" : "text-heading-24";

  return (
    <article className="flex flex-col gap-4">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
        <Image
          src={product.image}
          alt={product.title}
          fill
          className="object-cover"
        />
      </div>

      <div className="flex flex-col gap-3">
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
        <div className="text-black-600 text-body-16 flex items-center gap-2">
          <div className="flex gap-1">
            <div className="flex items-center gap-0.5">
              <HeartIcon className="size-4" />
              <span>{product.chatCount}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <ChatIcon className="size-4" />
              <span>{product.favoriteCount}</span>
            </div>
          </div>
          <p>{"\u00B7"}</p>
          <p>{formatRelativeTime(product.createdAt)}</p>
        </div>
      </div>
    </article>
  );
}
