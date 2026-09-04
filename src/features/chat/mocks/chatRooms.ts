import type { ChatRoom } from "@/features/chat/types/chatRoom";

import productImage from "@/assets/images/product-luffy-figure.jpg";
import profileImage from "@/assets/images/profile.png";

export const chatRooms: ChatRoom[] = [
  {
    id: 1,
    partnerName: "컬렉션모아모아",
    partnerImage: profileImage,
    lastMessage: "00역에서 만나는거 어떠신가요?",
    lastMessageAt: "3월 24일",
    productImage,
    productName: "원피스 조로 피규어",
    offeredProductImage: productImage,
  },
  {
    id: 2,
    partnerName: "피규어수집가",
    partnerImage: profileImage,
    lastMessage: "상품 상태를 조금 더 확인할 수 있을까요?",
    lastMessageAt: "3월 24일",
    productImage,
    productName: "원피스 조로 피규어",
  },
  {
    id: 3,
    partnerName: "조로팬",
    partnerImage: profileImage,
    lastMessage: "네, 그 시간에 거래 가능합니다!",
    lastMessageAt: "3월 24일",
    productImage,
    productName: "원피스 조로 피규어",
  },
  {
    id: 4,
    partnerName: "컬렉터K",
    partnerImage: profileImage,
    lastMessage: "택배 교환으로 진행해도 괜찮을까요?",
    lastMessageAt: "3월 23일",
    productImage,
    productName: "원피스 조로 피규어",
  },
  {
    id: 5,
    partnerName: "원피스컬렉터",
    partnerImage: profileImage,
    lastMessage: "사진 확인했습니다. 상태가 좋아 보이네요.",
    lastMessageAt: "3월 22일",
    productImage,
    productName: "원피스 조로 피규어",
  },
  {
    id: 6,
    partnerName: "모아모아",
    partnerImage: profileImage,
    lastMessage: "좋은 거래 감사합니다!",
    lastMessageAt: "3월 21일",
    productImage,
    productName: "원피스 조로 피규어",
  },
];
