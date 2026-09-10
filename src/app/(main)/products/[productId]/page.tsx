import Image from "next/image";
import { notFound } from "next/navigation";

import Button from "@/components/common/button/Button";
import ToggleButton from "@/components/common/button/ToggleButton";
import NewProductList from "@/features/products/components/NewProductList";
import { getProductDetail } from "@/features/products/services/getProductDetail";

import formatRelativeTime from "@/utils/formatRelativeTime";

import HeartOutlineIcon from "@/assets/icons/icon-heart-outline.svg";
import KebabIcon from "@/assets/icons/icon-kebab.svg";
import StarIcon from "@/assets/icons/icon-star.svg";

export default async function ProductDetailPage(
  props: PageProps<"/products/[productId]">,
) {
  const { productId } = await props.params;
  const id = Number(productId);

  if (!Number.isSafeInteger(id) || id <= 0) {
    notFound();
  }

  const product = await getProductDetail(id);

  if (!product) {
    notFound();
  }

  const isSale = product.transaction.type === "sale";

  const transactionColor = isSale ? "bg-brand-blue" : "bg-brand-green";

  const transactionLabel =
    product.transaction.type === "sale"
      ? `${product.transaction.price.toLocaleString()}원`
      : product.transaction.desiredItemName;

  const buttonLabel =
    product.transaction.type === "sale" ? `판매하기` : `교환하기`;

  return (
    <div className="m-auto flex w-full max-w-280 flex-col items-center justify-center gap-12">
      <article className="flex w-full flex-col gap-6 md:flex-row md:gap-12">
        {/* 왼쪽 */}
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg md:rounded-2xl">
            <Image
              src={product.image}
              alt={product.title}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>

          <section className="flex items-center gap-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-full">
              <Image
                src={product.seller.profileImageUrl}
                alt={`${product.seller.nickname} 프로필`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>

            <div className="text-black-900 flex flex-col gap-2">
              <p className="text-body-18">{product.seller.nickname}</p>

              <div className="flex items-center gap-1">
                <StarIcon className="text-brand-green size-4" />

                <span className="text-body-14">
                  {product.seller.rating}
                  <span> · 거래 </span>
                  {product.seller.tradeCount}회
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* 오른쪽 */}
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="text-black-900 flex justify-between">
            <div className="flex flex-col gap-3">
              <h1 className="text-heading-24">{product.title}</h1>
              <div className="text-black-400 text-label-16 flex items-center gap-2">
                <span>{product.category}</span>
                <span>·</span>
                <time dateTime={product.createdAt}>
                  {formatRelativeTime(product.createdAt)}
                </time>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`${transactionColor} flex items-center justify-center rounded-full px-2.5 py-1`}
                >
                  <span className="text-label-16 whitespace-nowrap text-white">
                    {isSale ? "판매" : "교환"}
                  </span>
                </div>
                <p className="text-heading-24 flex-1 truncate">
                  {transactionLabel}
                </p>
              </div>
            </div>
            <KebabIcon className="size-6" />
          </header>

          <section className="text-black-900 text-body-18">
            <p className="leading-10">{product.description}</p>
          </section>

          <div className="text-black-400 text-label-14 flex gap-1">
            <span>찜 {product.metrics.favoriteCount}</span>
            <span>·</span>
            <span>채팅 {product.metrics.chatCount}</span>
          </div>
          <div className="text-label-16 flex justify-between gap-4">
            <ToggleButton isPressed={false} size="lg" shape="rounded">
              <HeartOutlineIcon className="size-4.5" aria-hidden="true" />
              <span className="whitespace-nowrap">찜</span>
            </ToggleButton>
            <Button
              variant={isSale ? "blue" : "green"}
              size="lg"
              shape="rounded"
              className="min-w-0 flex-1 whitespace-nowrap"
            >
              {buttonLabel}
            </Button>
          </div>
        </div>
      </article>
      <NewProductList />
    </div>
  );
}
