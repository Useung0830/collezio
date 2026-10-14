import { doc, runTransaction, serverTimestamp } from "firebase/firestore";

import { validateChatAccess } from "@/features/chat/api/validateChatAccess";
import type { TradeTerms } from "@/features/chat/types/tradeProposal";
import { validateChatDocumentId } from "@/features/chat/utils/validateChatDocumentId";
import { validateTradeTerms } from "@/features/chat/utils/validateTradeTerms";

import { firebaseDb } from "@/lib/firebase";
import { validateFirebaseUser } from "@/lib/validateFirebaseUser";

export async function createTradeProposal(
  roomId: string,
  userId: string,
  id: string,
  input: TradeTerms,
  previousId: string | null,
) {
  [roomId, userId, id].forEach(validateChatDocumentId);
  const terms = validateTradeTerms(input);
  const roomRef = doc(firebaseDb, "chatRooms", roomId);
  const proposalRef = doc(roomRef, "proposals", id);
  const stateRef = doc(roomRef, "trade", "state");
  await runTransaction(firebaseDb, async (tx) => {
    validateFirebaseUser(userId);
    const [roomSnapshot, existing, stateSnapshot] = await Promise.all([
      tx.get(roomRef),
      tx.get(proposalRef),
      tx.get(stateRef),
    ]);
    if (!roomSnapshot.exists()) throw new Error("채팅방을 찾을 수 없습니다.");
    const room = roomSnapshot.data();
    if (![room.requesterId, room.sellerId].includes(userId))
      throw new Error("제안 권한이 없습니다.");
    if (existing.exists()) {
      if (
        existing.data().senderId !== userId ||
        JSON.stringify(existing.data().terms) !== JSON.stringify(terms)
      ) {
        // Firestore maps do not preserve insertion order.
        if (
          existing.data().senderId !== userId ||
          Object.entries(terms).some(
            ([key, value]) => existing.data().terms[key] !== value,
          )
        )
          throw new Error("전송 정보가 일치하지 않습니다.");
      }
      return;
    }
    const state = stateSnapshot.data() ?? { pendingId: null, acceptedId: null };
    if (state.pendingId)
      throw new Error("응답 대기 중인 제안을 먼저 처리해주세요.");
    if (state.acceptedId !== previousId)
      throw new Error(
        "확정 조건이 변경되었습니다. 창을 닫고 다시 확인해주세요.",
      );
    if (previousId) {
      const completion = await tx.get(doc(roomRef, "completions", previousId));
      if (completion.data()?.confirmedBy?.length === 2)
        throw new Error("완료된 거래의 조건은 변경할 수 없습니다.");
    }
    if (!previousId && userId !== room.requesterId)
      throw new Error("첫 제안은 구매·교환 신청자가 보낼 수 있습니다.");
    await validateChatAccess(tx, room.requesterId, room.sellerId);
    const productRef = doc(firebaseDb, "products", room.productId);
    const product = await tx.get(productRef);
    const isAvailable = (data: Record<string, unknown>) =>
      data.status === "available" ||
      (data.status === "reserved" && data.reservedByRoomId === roomId);
    if (
      !product.exists() ||
      product.data().sellerId !== room.sellerId ||
      product.data().transaction.type !== terms.kind ||
      !isAvailable(product.data())
    )
      throw new Error("현재 거래 가능한 상품이 아닙니다.");
    if (terms.exchangeProductId) {
      const exchange = await tx.get(
        doc(firebaseDb, "products", terms.exchangeProductId),
      );
      if (
        !exchange.exists() ||
        exchange.data().sellerId !== room.requesterId ||
        !isAvailable(exchange.data())
      )
        throw new Error("교환 상품의 소유자 또는 거래 상태를 확인해주세요.");
    }
    validateFirebaseUser(userId);
    tx.set(proposalRef, {
      senderId: userId,
      recipientId:
        userId === room.requesterId ? room.sellerId : room.requesterId,
      productId: room.productId,
      previousId,
      terms,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    tx.set(stateRef, { pendingId: id, acceptedId: state.acceptedId });
    const message = {
      content:
        terms.kind === "sale"
          ? "구매 제안을 보냈습니다."
          : "교환 제안을 보냈습니다.",
      senderId: userId,
      proposalId: id,
      createdAt: serverTimestamp(),
    };
    tx.set(doc(roomRef, "messages", id), message);
    tx.update(roomRef, {
      status: "active",
      visibleTo: [room.requesterId, room.sellerId],
      lastMessage: { id, ...message },
    });
    if (room.status === "draft")
      tx.update(productRef, { chatCount: (product.data().chatCount ?? 0) + 1 });
  });
}
