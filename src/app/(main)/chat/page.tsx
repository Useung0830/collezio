import type { Metadata } from "next";

import ChatListBackButton from "@/features/chat/components/ChatListBackButton";
import ChatRoomList from "@/features/chat/components/ChatRoomList";

export const metadata: Metadata = {
  title: "채팅 목록",
  description: "소장품 교환을 위해 진행 중인 대화를 확인해보세요.",
};

export default function ChatPage() {
  return (
    <section className="mx-auto w-full max-w-184 pb-20">
      <div className="flex items-center gap-2">
        <ChatListBackButton />
        <h1 className="text-heading-24 text-black-900">채팅목록</h1>
      </div>

      <ChatRoomList />
    </section>
  );
}
