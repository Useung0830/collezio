import type { ProductTransaction } from "@/features/products/types/product";

export interface RegisteredChatRoom {
  id: string;
  productId: string;
  sellerId: string;
  requesterId: string;
  status: "draft";
  createdAt: string;
}

export interface ChatRoomView extends RegisteredChatRoom {
  partnerName: string;
  partnerImageUrl: string | null;
  productTitle: string;
  productImageUrl: string | null;
  transaction: ProductTransaction | null;
}
