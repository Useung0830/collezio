import type { StaticImageData } from "next/image";

export type ChatRoom = {
  id: number;
  partnerName: string;
  partnerImage: StaticImageData;
  lastMessage: string;
  lastMessageAt: string;
  productImage: StaticImageData;
  productName: string;
  offeredProductImage?: StaticImageData;
};

export type ChatMessage = {
  id: number;
  chatRoomId: number;
  content: string;
  sentAt: string;
  sender: "me" | "partner";
  isRead: boolean;
  imageUrl?: string;
};
