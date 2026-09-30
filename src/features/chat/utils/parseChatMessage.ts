import { Timestamp } from "firebase/firestore";

import { MAX_CHAT_MESSAGE_LENGTH } from "@/features/chat/constants/chat";
import type { ChatMessage } from "@/features/chat/types/chatMessage";
import { validateChatDocumentId } from "@/features/chat/utils/validateChatDocumentId";

export function parseChatMessage(id: string, value: unknown): ChatMessage {
  if (typeof value !== "object" || value === null)
    throw new Error("메시지를 확인할 수 없습니다.");
  const data: Record<string, unknown> = Object.fromEntries(
    Object.entries(value),
  );
  if (
    typeof data.content !== "string" ||
    !data.content.trim() ||
    data.content.length > MAX_CHAT_MESSAGE_LENGTH ||
    typeof data.senderId !== "string" ||
    !(data.createdAt instanceof Timestamp)
  ) {
    throw new Error("메시지를 확인할 수 없습니다.");
  }
  validateChatDocumentId(id);
  validateChatDocumentId(data.senderId);
  return {
    id,
    content: data.content,
    senderId: data.senderId,
    createdAt: data.createdAt.toDate().toISOString(),
  };
}
