import { FirebaseError } from "firebase/app";
import {
  doc,
  getDocFromServer,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { MAX_CHAT_MESSAGE_LENGTH } from "@/features/chat/constants/chat";
import type { SendChatMessageInput } from "@/features/chat/types/chatMessage";
import { parseChatMessage } from "@/features/chat/utils/parseChatMessage";
import { parseChatRoom } from "@/features/chat/utils/parseChatRoom";
import { validateChatDocumentId } from "@/features/chat/utils/validateChatDocumentId";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";
import { validateFirebaseUser } from "@/lib/validateFirebaseUser";

const MAX_SEND_ATTEMPTS = 3;

export async function sendChatMessage({
  roomId,
  messageId,
  userId,
  content,
}: SendChatMessageInput) {
  for (const id of [roomId, messageId, userId]) validateChatDocumentId(id);
  const text = content.trim();
  if (!text || text.length > MAX_CHAT_MESSAGE_LENGTH || messageId.length > 128)
    throw new Error("메시지는 1~2,000자로 입력해주세요.");
  await firebaseAuth.authStateReady();
  validateFirebaseUser(userId);
  const roomRef = doc(firebaseDb, "chatRooms", roomId);
  const messageRef = doc(roomRef, "messages", messageId);
  let observed:
    | {
        productId: string;
        lastMessageId: string | null;
        chatCount: number | null;
      }
    | undefined;

  for (let attempt = 1; ; attempt += 1) {
    try {
      const productId = await runTransaction(
        firebaseDb,
        async (transaction) => {
          validateFirebaseUser(userId);
          const roomSnapshot = await transaction.get(roomRef);
          const messageSnapshot = await transaction.get(messageRef);
          validateFirebaseUser(userId);
          if (!roomSnapshot.exists())
            throw new Error("채팅방을 찾을 수 없습니다.");
          const room = parseChatRoom(roomId, roomSnapshot.data());
          if (userId !== room.requesterId && userId !== room.sellerId)
            throw new Error("채팅방에 참여할 수 없습니다.");
          // 응답이 끊긴 뒤 같은 전송을 재시도해도 이미 저장된 메시지를 재사용합니다.
          if (messageSnapshot.exists()) {
            const existing = parseChatMessage(
              messageId,
              messageSnapshot.data(),
            );
            if (existing.senderId !== userId || existing.content !== text)
              throw new Error("메시지 전송 정보가 일치하지 않습니다.");
            return room.productId;
          }
          observed = {
            productId: room.productId,
            lastMessageId: room.lastMessage?.id ?? null,
            chatCount: null,
          };
          const productRef = doc(firebaseDb, "products", room.productId);
          if (room.status === "draft") {
            if (room.requesterId !== userId)
              throw new Error("첫 메시지는 대화 신청자만 보낼 수 있습니다.");
            const product = await transaction.get(productRef);
            validateFirebaseUser(userId);
            if (!product.exists() || product.data().sellerId !== room.sellerId)
              throw new Error(
                "상품 정보를 확인할 수 없어 대화를 시작할 수 없습니다.",
              );
            const count: unknown = product.data().chatCount ?? 0;
            if (
              typeof count !== "number" ||
              !Number.isSafeInteger(count) ||
              count < 0 ||
              !Number.isSafeInteger(count + 1)
            )
              throw new Error("상품의 채팅 수를 확인할 수 없습니다.");
            observed.chatCount = count;
            transaction.update(productRef, { chatCount: count + 1 });
          }
          const message = {
            content: text,
            senderId: userId,
            createdAt: serverTimestamp(),
          };
          transaction.set(messageRef, message);
          transaction.update(roomRef, {
            status: "active",
            visibleTo: [room.requesterId, room.sellerId],
            lastMessage: { id: messageId, ...message },
          });
          return room.productId;
        },
      );
      validateFirebaseUser(userId);
      return { roomId, messageId, productId };
    } catch (error) {
      if (
        !(error instanceof FirebaseError) ||
        error.code !== "permission-denied" ||
        !observed ||
        attempt >= MAX_SEND_ATTEMPTS
      )
        throw error;
      validateFirebaseUser(userId);
      const latestRoom = await getDocFromServer(roomRef);
      validateFirebaseUser(userId);
      if (!latestRoom.exists()) throw error;
      const latest = parseChatRoom(roomId, latestRoom.data());
      if ((latest.lastMessage?.id ?? null) !== observed.lastMessageId) continue;
      if (observed.chatCount !== null) {
        const product = await getDocFromServer(
          doc(firebaseDb, "products", observed.productId),
        );
        validateFirebaseUser(userId);
        if (
          product.exists() &&
          (product.data().chatCount ?? 0) !== observed.chatCount
        )
          continue;
      }
      throw error;
    }
  }
}
