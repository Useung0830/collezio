import Image from "next/image";
import Link from "next/link";

import type { ChatRoomView } from "@/features/chat/types/registeredChatRoom";

import ExchangeIcon from "@/assets/icons/icon-exchange.svg";
import GalleryIcon from "@/assets/icons/icon-gallery.svg";

type ChatProductSummaryProps = { chatRoom: ChatRoomView };

export default function ChatProductSummary({
  chatRoom,
}: ChatProductSummaryProps) {
  const transaction = chatRoom.transaction;
  return (
    <section
      aria-label="거래 상품"
      className="flex shrink-0 items-center gap-2 px-3 pt-1 pb-4 sm:gap-3"
    >
      <div className="flex shrink-0 items-center">
        {chatRoom.productImageUrl && (
          <Image
            src={chatRoom.productImageUrl}
            alt={chatRoom.productTitle}
            width={48}
            height={48}
            className="size-12 rounded-xl object-cover"
          />
        )}
        {!chatRoom.productImageUrl && (
          <div
            className="bg-black-100 text-black-400 flex size-12 items-center justify-center rounded-xl"
            aria-label="상품 이미지 없음"
          >
            <GalleryIcon className="size-6" aria-hidden="true" />
          </div>
        )}
        {transaction?.type === "exchange" && (
          <>
            <span className="text-black-400 z-10 -mx-1 flex size-5 items-center justify-center rounded-full bg-white">
              <ExchangeIcon className="size-4" aria-hidden="true" />
            </span>
            <div
              className="bg-black-100 text-black-400 flex size-12 items-center justify-center rounded-xl"
              aria-label="교환 희망 상품 이미지 미등록"
              title={transaction.desiredItemName}
            >
              <GalleryIcon className="size-6" aria-hidden="true" />
            </div>
          </>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <Link
          href={`/products/${encodeURIComponent(chatRoom.productId)}`}
          className="text-caption-12 text-black-900 block truncate hover:underline"
        >
          {chatRoom.productTitle}
        </Link>
        {transaction && (
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`text-caption-12-bold shrink-0 rounded-full px-2 py-0.5 text-white ${transaction.type === "sale" ? "bg-brand-blue" : "bg-brand-green"}`}
            >
              {transaction.type === "sale" ? "판매" : "교환"}
            </span>
            <p className="text-label-14 text-black-900 truncate">
              {transaction.type === "sale"
                ? `${transaction.price.toLocaleString("ko-KR")}원`
                : transaction.desiredItemName}
            </p>
          </div>
        )}
      </div>
      {transaction && (
        <button
          type="button"
          disabled
          title="거래 확정 기능 준비 중"
          aria-label={`${transaction.type === "sale" ? "구매하기" : "교환하기"} (준비 중)`}
          className={`text-caption-12-bold shrink-0 rounded-full px-3 py-2 text-white disabled:cursor-not-allowed ${transaction.type === "sale" ? "bg-brand-blue" : "bg-brand-green"}`}
        >
          {transaction.type === "sale" ? "구매하기" : "교환하기"}
        </button>
      )}
    </section>
  );
}
