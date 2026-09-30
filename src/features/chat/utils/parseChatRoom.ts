import { Timestamp } from "firebase/firestore";

import type { RegisteredChatRoom } from "@/features/chat/types/registeredChatRoom";
import { validateChatDocumentId } from "@/features/chat/utils/validateChatDocumentId";

export function parseChatRoom(id: string, value: unknown): RegisteredChatRoom {
  if (typeof value !== "object" || value === null) {
    throw new Error("채팅방 정보를 확인할 수 없습니다.");
  }
  const data: Record<string, unknown> = Object.fromEntries(
    Object.entries(value),
  );
  if (
    typeof data.productId !== "string" ||
    typeof data.sellerId !== "string" ||
    typeof data.requesterId !== "string" ||
    data.sellerId === data.requesterId ||
    data.status !== "draft" ||
    !(data.createdAt instanceof Timestamp) ||
    !Array.isArray(data.visibleTo) ||
    data.visibleTo.length !== 1 ||
    data.visibleTo[0] !== data.requesterId
  ) {
    throw new Error("채팅방 정보를 확인할 수 없습니다.");
  }
  for (const documentId of [
    id,
    data.productId,
    data.sellerId,
    data.requesterId,
  ]) {
    validateChatDocumentId(documentId);
  }
  return {
    id,
    productId: data.productId,
    sellerId: data.sellerId,
    requesterId: data.requesterId,
    status: data.status,
    createdAt: data.createdAt.toDate().toISOString(),
  };
}
