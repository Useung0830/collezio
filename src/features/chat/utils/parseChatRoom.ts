import { Timestamp } from "firebase/firestore";

import type { RegisteredChatRoom } from "@/features/chat/types/registeredChatRoom";
import { parseChatMessage } from "@/features/chat/utils/parseChatMessage";
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
    (data.status !== "draft" && data.status !== "active") ||
    !(data.createdAt instanceof Timestamp) ||
    !Array.isArray(data.visibleTo) ||
    data.visibleTo.length !== (data.status === "draft" ? 1 : 2) ||
    (data.status === "active" && data.visibleTo[1] !== data.sellerId) ||
    data.visibleTo[0] !== data.requesterId
  ) {
    throw new Error("채팅방 정보를 확인할 수 없습니다.");
  }
  let lastMessage = null;
  if (data.status === "active") {
    const summary = data.lastMessage;
    if (
      typeof summary !== "object" ||
      summary === null ||
      !("id" in summary) ||
      typeof summary.id !== "string"
    )
      throw new Error("마지막 메시지를 확인할 수 없습니다.");
    lastMessage = parseChatMessage(summary.id, summary);
    if (
      lastMessage.senderId !== data.requesterId &&
      lastMessage.senderId !== data.sellerId
    )
      throw new Error("메시지 발신자를 확인할 수 없습니다.");
  } else if (data.lastMessage !== undefined) {
    throw new Error("시작 전 채팅방의 상태가 올바르지 않습니다.");
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
    lastMessage,
    withdrawnUserIds: Array.isArray(data.withdrawnUserIds)
      ? data.withdrawnUserIds.filter(
          (userId): userId is string => typeof userId === "string",
        )
      : [],
  };
}
