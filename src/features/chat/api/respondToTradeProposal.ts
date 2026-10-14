import { doc, runTransaction, serverTimestamp } from "firebase/firestore";

import { validateChatAccess } from "@/features/chat/api/validateChatAccess";
import { validateChatDocumentId } from "@/features/chat/utils/validateChatDocumentId";
import { validateTradeTerms } from "@/features/chat/utils/validateTradeTerms";

import { firebaseDb } from "@/lib/firebase";
import { validateFirebaseUser } from "@/lib/validateFirebaseUser";

export async function respondToTradeProposal(
  roomId: string,
  userId: string,
  id: string,
  action: "accepted" | "rejected" | "withdrawn",
) {
  [roomId, userId, id].forEach(validateChatDocumentId);
  const roomRef = doc(firebaseDb, "chatRooms", roomId);
  const proposalRef = doc(roomRef, "proposals", id);
  const stateRef = doc(roomRef, "trade", "state");
  await runTransaction(firebaseDb, async (tx) => {
    validateFirebaseUser(userId);
    const [roomSnapshot, proposalSnapshot, stateSnapshot] = await Promise.all([
      tx.get(roomRef),
      tx.get(proposalRef),
      tx.get(stateRef),
    ]);
    if (
      !roomSnapshot.exists() ||
      !proposalSnapshot.exists() ||
      !stateSnapshot.exists()
    )
      throw new Error("제안을 찾을 수 없습니다.");
    const room = roomSnapshot.data(),
      proposal = proposalSnapshot.data(),
      state = stateSnapshot.data();
    if (
      (action === "withdrawn" ? proposal.senderId : proposal.recipientId) !==
      userId
    )
      throw new Error("제안을 처리할 권한이 없습니다.");
    if (proposal.status === action) return;
    if (proposal.status !== "pending" || state.pendingId !== id)
      throw new Error("이미 처리된 제안입니다. 최신 상태를 확인해주세요.");
    if (action === "accepted") {
      if (proposal.previousId !== state.acceptedId)
        throw new Error("확정 조건이 변경되었습니다. 다시 확인해주세요.");
      const previousRef = proposal.previousId
        ? doc(roomRef, "proposals", proposal.previousId)
        : null;
      const previous = previousRef ? await tx.get(previousRef) : null;
      if (
        previous &&
        (!previous.exists() || previous.data().status !== "accepted")
      )
        throw new Error("이전 약속을 확인할 수 없습니다.");
      const terms = validateTradeTerms(proposal.terms);
      await validateChatAccess(tx, room.requesterId, room.sellerId);
      const productIds = [
        proposal.productId,
        ...(terms.exchangeProductId ? [terms.exchangeProductId] : []),
      ];
      const products = await Promise.all(
        productIds.map((productId) =>
          tx.get(doc(firebaseDb, "products", productId)),
        ),
      );
      for (const [index, product] of products.entries()) {
        if (
          !product.exists() ||
          product.data().sellerId !==
            (index === 0 ? room.sellerId : room.requesterId) ||
          !(
            product.data().status === "available" ||
            (product.data().status === "reserved" &&
              product.data().reservedByRoomId === roomId)
          )
        )
          throw new Error(
            "상품이 이미 예약되었거나 거래할 수 없는 상태입니다.",
          );
        if (index === 0 && product.data().transaction.type !== terms.kind)
          throw new Error("상품의 거래 종류가 변경되었습니다.");
      }
      const oldExchangeId = previous?.data()?.terms.exchangeProductId;
      const released =
        oldExchangeId && oldExchangeId !== terms.exchangeProductId
          ? await tx.get(doc(firebaseDb, "products", oldExchangeId))
          : null;
      if (
        released &&
        (!released.exists() ||
          released.data().status !== "reserved" ||
          released.data().reservedByRoomId !== roomId)
      )
        throw new Error("기존 교환 상품의 예약 상태를 확인해주세요.");
      for (const product of products)
        tx.update(product.ref, {
          status: "reserved",
          reservedByRoomId: roomId,
        });
      if (released)
        tx.update(released.ref, {
          status: "available",
          reservedByRoomId: null,
        });
      if (previousRef)
        tx.update(previousRef, {
          status: "superseded",
          updatedAt: serverTimestamp(),
        });
    }
    validateFirebaseUser(userId);
    tx.update(proposalRef, { status: action, updatedAt: serverTimestamp() });
    tx.update(stateRef, {
      pendingId: null,
      acceptedId: action === "accepted" ? id : state.acceptedId,
    });
  });
}
