import type { ChatMessage } from "@/features/chat/types/chatMessage";
import type { ProductTransaction } from "@/features/products/types/product";

export interface RegisteredChatRoom {
  id: string;
  productId: string;
  sellerId: string;
  requesterId: string;
  status: "draft" | "active";
  createdAt: string;
  lastMessage: ChatMessage | null;
  withdrawnUserIds?: string[];
}

export interface ChatRoomView extends RegisteredChatRoom {
  partnerName: string;
  isPartnerWithdrawn: boolean;
  partnerImageUrl: string | null;
  productTitle: string;
  productImageUrl: string | null;
  transaction: ProductTransaction | null;
}
