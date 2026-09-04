import ChatRoomCard from "@/features/chat/components/ChatRoomCard";
import { chatRooms } from "@/features/chat/mocks/chatRooms";

export default function ChatRoomList() {
  return (
    <ul className="mt-5 flex flex-col gap-1">
      {chatRooms.map((chatRoom) => (
        <ChatRoomCard key={chatRoom.id} chatRoom={chatRoom} />
      ))}
    </ul>
  );
}
