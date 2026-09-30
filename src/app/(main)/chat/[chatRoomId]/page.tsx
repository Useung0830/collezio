import RegisteredChatRoom from "@/features/chat/components/RegisteredChatRoom";

export default async function ChatRoomPage(
  props: PageProps<"/chat/[chatRoomId]">,
) {
  const { chatRoomId } = await props.params;
  return <RegisteredChatRoom roomId={chatRoomId} />;
}
