import type { ChatMessage } from "@/features/chat/types/chatRoom";

export const chatMessages: ChatMessage[] = [
  {
    id: 1,
    chatRoomId: 1,
    content: "안녕하세요",
    sentAt: "오후 4:56",
    sender: "me",
    isRead: true,
  },
  {
    id: 2,
    chatRoomId: 1,
    content: "안녕하세요! 교환 제안 확인했습니다.",
    sentAt: "오후 5:20",
    sender: "partner",
    isRead: true,
  },
  {
    id: 3,
    chatRoomId: 1,
    content: "상품 상태는 사진과 동일한가요?",
    sentAt: "오후 5:22",
    sender: "me",
    isRead: true,
  },
  {
    id: 4,
    chatRoomId: 1,
    content: "네, 미개봉 상태로 보관하고 있어요.",
    sentAt: "오후 5:24",
    sender: "partner",
    isRead: true,
  },
  {
    id: 5,
    chatRoomId: 1,
    content: "00역에서 만나는 거 어떠신가요?",
    sentAt: "오후 5:27",
    sender: "me",
    isRead: true,
  },
];
