import Image from "next/image";
import Link from "next/link";

import type { ChatRoomView } from "@/features/chat/types/registeredChatRoom";
import ProfileAvatar from "@/features/user/components/ProfileAvatar";

import formatRelativeTime from "@/utils/formatRelativeTime";

type ChatRoomCardProps = { chatRoom: ChatRoomView };

export default function ChatRoomCard({ chatRoom }: ChatRoomCardProps) {
  const lastActivityAt = chatRoom.lastMessage?.createdAt ?? chatRoom.createdAt;
  return (
    <li>
      <Link
        href={`/chat/${encodeURIComponent(chatRoom.id)}`}
        className="hover:bg-black-50 flex min-w-0 items-center gap-3 rounded-2xl px-2 py-3 transition-colors sm:gap-4"
      >
        <ProfileAvatar
          imageUrl={chatRoom.partnerImageUrl}
          nickname={chatRoom.partnerName}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-label-16 text-black-900 truncate">
              {chatRoom.partnerName}
            </h2>
            <time
              className="text-caption-12 text-black-500 shrink-0"
              dateTime={lastActivityAt}
            >
              {formatRelativeTime(lastActivityAt)}
            </time>
          </div>
          <p className="text-body-14 text-black-900 mt-1 truncate">
            {chatRoom.productTitle}
          </p>
          <p className="text-body-14 text-black-600 mt-1 truncate">
            {chatRoom.lastMessage?.content ?? "아직 보낸 메시지가 없습니다."}
          </p>
        </div>
        {chatRoom.productImageUrl && (
          <Image
            src={chatRoom.productImageUrl}
            alt={chatRoom.productTitle}
            width={56}
            height={56}
            className="size-14 shrink-0 rounded-xl object-cover"
          />
        )}
      </Link>
    </li>
  );
}
