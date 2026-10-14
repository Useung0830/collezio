import type { Metadata } from "next";

import RegisteredChatRoom from "@/features/chat/components/RegisteredChatRoom";

export const metadata: Metadata = {
  title: "채팅방",
  description: "거래 상대방과 메시지를 주고받으며 교환을 진행해보세요.",
};

export default async function ChatRoomPage(
  props: PageProps<"/chat/[chatRoomId]">,
) {
  const { chatRoomId } = await props.params;
  return <RegisteredChatRoom roomId={chatRoomId} />;
}
