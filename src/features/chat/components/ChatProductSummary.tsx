import Image from "next/image";

import type { ChatRoom } from "@/features/chat/types/chatRoom";

import ExchangeIcon from "@/assets/icons/icon-exchange.svg";

type ChatProductSummaryProps = {
  chatRoom: ChatRoom;
};

export default function ChatProductSummary({
  chatRoom,
}: ChatProductSummaryProps) {
  return (
    <section className="border-black-200 flex items-center gap-4 border-y px-4 py-3">
      <div className="flex shrink-0 items-center">
        {chatRoom.offeredProductImage && (
          <>
            <Image
              src={chatRoom.offeredProductImage}
              alt="내 교환 상품"
              width={56}
              height={56}
              className="size-14 rounded-xl object-cover"
            />
            <span className="border-black-200 z-10 -mx-1.5 flex size-6 items-center justify-center rounded-full border bg-white">
              <ExchangeIcon className="size-3.5" aria-hidden="true" />
            </span>
          </>
        )}
        <Image
          src={chatRoom.productImage}
          alt={chatRoom.productName}
          width={56}
          height={56}
          className="size-14 rounded-xl object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-body-14 text-black-600 truncate">
          원피스 피규어 교환해요!
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="bg-brand-green text-caption-12-bold rounded-full px-2.5 py-1 text-white">
            교환
          </span>
          <p className="text-label-16 text-black-900 truncate">
            {chatRoom.productName}
          </p>
        </div>
      </div>

      <button className="bg-brand-green text-label-14 shrink-0 rounded-full px-4 py-2 text-white">
        교환하기
      </button>
    </section>
  );
}
