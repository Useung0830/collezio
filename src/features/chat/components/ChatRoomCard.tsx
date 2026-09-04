import Image from "next/image";
import Link from "next/link";

import type { ChatRoom } from "@/features/chat/types/chatRoom";

import ExchangeIcon from "@/assets/icons/icon-exchange.svg";

type ChatRoomCardProps = {
  chatRoom: ChatRoom;
};

export default function ChatRoomCard({ chatRoom }: ChatRoomCardProps) {
  return (
    <li>
      <Link
        href={`/chat/${chatRoom.id}`}
        className="hover:bg-black-50 flex min-w-0 items-center gap-3 rounded-2xl px-2 py-3 transition-colors sm:gap-4"
      >
        <Image
          src={chatRoom.partnerImage}
          alt={`${chatRoom.partnerName} 프로필`}
          width={64}
          height={64}
          className="size-14 shrink-0 rounded-full object-cover sm:size-16"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-label-16 text-black-900 truncate">
              {chatRoom.partnerName}
            </h2>
            <time className="text-caption-12 text-black-500 shrink-0">
              {chatRoom.lastMessageAt}
            </time>
          </div>
          <p className="text-body-14 text-black-700 mt-1 truncate">
            {chatRoom.lastMessage}
          </p>
        </div>

        <div className="flex shrink-0 items-center">
          {chatRoom.offeredProductImage && (
            <>
              <Image
                src={chatRoom.offeredProductImage}
                alt="내 교환 상품"
                width={56}
                height={56}
                className="size-12 rounded-xl object-cover sm:size-14"
              />
              <span className="border-black-200 z-10 -mx-1.5 flex size-6 items-center justify-center rounded-full border bg-white">
                <ExchangeIcon className="size-3.5" aria-hidden="true" />
              </span>
            </>
          )}
          <Image
            src={chatRoom.productImage}
            alt="채팅 상품"
            width={56}
            height={56}
            className="size-12 rounded-xl object-cover sm:size-14"
          />
        </div>
      </Link>
    </li>
  );
}
