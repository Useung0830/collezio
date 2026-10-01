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
  if (
    data.proposalId !== undefined &&
    (data.proposalId !== id ||
      data.imagePath !== undefined ||
      data.imagePaths !== undefined ||
      data.previousMessageId !== undefined)
  )
    throw new Error("거래 제안 메시지를 확인할 수 없습니다.");
  if (
    data.imagePath !== undefined &&
    (typeof data.imagePath !== "string" ||
      !data.imagePath.startsWith("chat/") ||
      data.imagePath.split("/").length !== 4 ||
      data.imagePath.split("/")[2] !== data.senderId ||
      data.imagePath.split("/")[3] !== id ||
      data.content !== "사진" ||
      data.previousMessageId !== undefined)
  )
    throw new Error("이미지 메시지를 확인할 수 없습니다.");
  if (data.imagePaths !== undefined) {
    if (
      !Array.isArray(data.imagePaths) ||
      data.imagePaths.length < 1 ||
      data.imagePaths.length > 10 ||
      data.imagePath !== undefined ||
      data.previousMessageId !== undefined ||
      data.content !== "사진" ||
      !id.endsWith("-0")
    )
      throw new Error("이미지 묶음을 확인할 수 없습니다.");
    const roomId =
      typeof data.imagePaths[0] === "string"
        ? data.imagePaths[0].split("/")[1]
        : "";
    validateChatDocumentId(roomId);
    if (
      !data.imagePaths.every(
        (path, index) =>
          path === `chat/${roomId}/${data.senderId}/${id}/${index}`,
      )
    )
      throw new Error("이미지 묶음을 확인할 수 없습니다.");
  }
  if (
    data.previousMessageId !== undefined &&
    (typeof data.previousMessageId !== "string" ||
      !id.endsWith("-1") ||
      data.previousMessageId !== `${id.slice(0, -2)}-0`)
  )
    throw new Error("메시지 순서를 확인할 수 없습니다.");
  return {
    id,
    content: data.content,
    senderId: data.senderId,
    createdAt: data.createdAt.toDate().toISOString(),
    ...(typeof data.proposalId === "string"
      ? { proposalId: data.proposalId }
      : {}),
    ...(typeof data.imagePath === "string"
      ? { imagePath: data.imagePath }
      : {}),
    ...(Array.isArray(data.imagePaths)
      ? { imagePaths: data.imagePaths as string[] }
      : {}),
    ...(typeof data.previousMessageId === "string"
      ? { previousMessageId: data.previousMessageId }
      : {}),
  };
}
