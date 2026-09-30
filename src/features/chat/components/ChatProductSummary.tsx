import Image from "next/image";
import Link from "next/link";

import type { ChatRoomView } from "@/features/chat/types/registeredChatRoom";

type ChatProductSummaryProps = { chatRoom: ChatRoomView };

export default function ChatProductSummary({
  chatRoom,
}: ChatProductSummaryProps) {
  const transaction = chatRoom.transaction;
  return (
    <section className="border-black-200 flex items-center gap-4 border-y px-4 py-3">
      {chatRoom.productImageUrl && (
        <Image
          src={chatRoom.productImageUrl}
          alt={chatRoom.productTitle}
          width={56}
          height={56}
          className="size-14 shrink-0 rounded-xl object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <Link
          href={`/products/${encodeURIComponent(chatRoom.productId)}`}
          className="text-body-14 text-black-900 block truncate"
        >
          {chatRoom.productTitle}
        </Link>
        {transaction && (
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`text-caption-12-bold shrink-0 rounded-full px-2.5 py-1 text-white ${transaction.type === "sale" ? "bg-brand-blue" : "bg-brand-green"}`}
            >
              {transaction.type === "sale" ? "판매" : "교환"}
            </span>
            <p className="text-label-16 text-black-900 truncate">
              {transaction.type === "sale"
                ? `${transaction.price.toLocaleString("ko-KR")}원`
                : transaction.desiredItemName}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
