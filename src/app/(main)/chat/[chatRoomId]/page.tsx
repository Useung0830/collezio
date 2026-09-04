import { notFound } from "next/navigation";

import ChatConversation from "@/features/chat/components/ChatConversation";
import ChatProductSummary from "@/features/chat/components/ChatProductSummary";
import ChatRoomHeader from "@/features/chat/components/ChatRoomHeader";
import { chatMessages } from "@/features/chat/mocks/chatMessages";
import { chatRooms } from "@/features/chat/mocks/chatRooms";

export function generateStaticParams() {
  return chatRooms.map((chatRoom) => ({ chatRoomId: String(chatRoom.id) }));
}

export default async function ChatRoomPage(
  props: PageProps<"/chat/[chatRoomId]">,
) {
  const { chatRoomId } = await props.params;
  const id = Number(chatRoomId);
  const chatRoom = chatRooms.find((room) => room.id === id);

  if (!chatRoom) {
    notFound();
  }

  const messages = chatMessages.filter((message) => message.chatRoomId === id);

  return (
    <div className="mx-auto flex h-[calc(100dvh-7rem)] min-h-150 w-full max-w-184 flex-col overflow-hidden bg-white">
      <ChatRoomHeader chatRoom={chatRoom} />
      <ChatProductSummary chatRoom={chatRoom} />
      <ChatConversation chatRoomId={id} initialMessages={messages} />
    </div>
  );
}
