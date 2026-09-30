import { FirebaseError } from "firebase/app";
import {
  collection,
  doc,
  getDocFromServer,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { validateChatDocumentId } from "@/features/chat/utils/validateChatDocumentId";
import { validateChatUser } from "@/features/chat/utils/validateChatUser";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";

interface CreateChatRoomInput {
  productId: string;
  userId: string;
}

export async function createChatRoom({
  productId,
  userId,
}: CreateChatRoomInput) {
  validateChatDocumentId(productId);
  validateChatDocumentId(userId);
  await firebaseAuth.authStateReady();
  validateChatUser(userId);

  const productRef = doc(firebaseDb, "products", productId);
  const linkRef = doc(firebaseDb, "users", userId, "productChats", productId);
  const roomRef = doc(collection(firebaseDb, "chatRooms"));
  const getLinkedRoomId = (data: unknown) => {
    if (
      typeof data !== "object" ||
      data === null ||
      !("roomId" in data) ||
      typeof data.roomId !== "string"
    ) {
      throw new Error("기존 채팅방을 확인할 수 없습니다.");
    }
    validateChatDocumentId(data.roomId);
    return data.roomId;
  };

  try {
    const roomId = await runTransaction(firebaseDb, async (transaction) => {
      validateChatUser(userId);
      const link = await transaction.get(linkRef);
      if (link.exists()) return getLinkedRoomId(link.data());
      const product = await transaction.get(productRef);
      validateChatUser(userId);
      const sellerId: unknown = product.data()?.sellerId;
      if (!product.exists() || typeof sellerId !== "string") {
        throw new Error("상품 또는 판매자 정보를 확인할 수 없습니다.");
      }
      validateChatDocumentId(sellerId);
      if (sellerId === userId) {
        throw new Error("내 상품에는 채팅을 시작할 수 없습니다.");
      }

      // 사용자·상품별 연결 문서를 함께 생성하여 동시 요청도 같은 방을 사용합니다.
      transaction.set(linkRef, { roomId: roomRef.id });
      transaction.set(roomRef, {
        productId,
        sellerId,
        requesterId: userId,
        status: "draft",
        visibleTo: [userId],
        createdAt: serverTimestamp(),
      });
      return roomRef.id;
    });
    validateChatUser(userId);
    return roomId;
  } catch (error) {
    // 다른 탭이 먼저 생성하면 규칙 검사가 트랜잭션 재시도보다 먼저 거부할 수 있습니다.
    if (
      !(error instanceof FirebaseError) ||
      error.code !== "permission-denied"
    ) {
      throw error;
    }
    validateChatUser(userId);
    const link = await getDocFromServer(linkRef);
    validateChatUser(userId);
    if (!link.exists()) throw error;
    return getLinkedRoomId(link.data());
  }
}
