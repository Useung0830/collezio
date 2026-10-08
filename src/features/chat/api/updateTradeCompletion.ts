import { doc, serverTimestamp } from "firebase/firestore";

import { runTradeCompletionTransaction } from "@/features/chat/api/runTradeCompletionTransaction";
import { validateChatAccess } from "@/features/chat/api/validateChatAccess";
import { parseTradeCompletion } from "@/features/chat/utils/parseTradeCompletion";
import { validateChatDocumentId } from "@/features/chat/utils/validateChatDocumentId";

import { firebaseDb } from "@/lib/firebase";
import { validateFirebaseUser } from "@/lib/validateFirebaseUser";

export async function updateTradeCompletion(
  roomId: string,
  userId: string,
  proposalId: string,
  isConfirmed: boolean,
) {
  [roomId, userId, proposalId].forEach(validateChatDocumentId);
  const roomRef = doc(firebaseDb, "chatRooms", roomId);
  const completionRef = doc(roomRef, "completions", proposalId);
  await runTradeCompletionTransaction(
    completionRef,
    async (tx, completionSnapshot) => {
      validateFirebaseUser(userId);
      const [roomSnapshot, proposalSnapshot, stateSnapshot] = await Promise.all(
        [
          tx.get(roomRef),
          tx.get(doc(roomRef, "proposals", proposalId)),
          tx.get(doc(roomRef, "trade", "state")),
        ],
      );
      const room = roomSnapshot.data();
      const proposal = proposalSnapshot.data();
      const state = stateSnapshot.data();
      if (!room || ![room.requesterId, room.sellerId].includes(userId))
        throw new Error("거래를 확인할 권한이 없습니다.");
      if (
        !proposal ||
        proposal.status !== "accepted" ||
        state?.acceptedId !== proposalId
      )
        throw new Error("확정된 거래를 다시 확인해주세요.");
      if (state.pendingId)
        throw new Error("조건 변경 제안을 먼저 처리해주세요.");
      if (proposal.terms.scheduledAt > Date.now())
        throw new Error("약속 또는 발송 시간이 지난 뒤 완료할 수 있습니다.");
      const completion = parseTradeCompletion(completionSnapshot.data());
      if (completion.confirmedBy.includes(userId)) return;
      await validateChatAccess(tx, room.requesterId, room.sellerId);
      const confirmedBy = isConfirmed
        ? [...completion.confirmedBy, userId]
        : completion.confirmedBy;
      const deferredBy = isConfirmed
        ? completion.deferredBy.filter((id) => id !== userId)
        : [...new Set([...completion.deferredBy, userId])];
      const products =
        confirmedBy.length === 2
          ? await Promise.all(
              [
                proposal.productId,
                ...(proposal.terms.exchangeProductId
                  ? [proposal.terms.exchangeProductId]
                  : []),
              ].map((id) => tx.get(doc(firebaseDb, "products", id))),
            )
          : [];
      for (const product of products) {
        if (
          !product.exists() ||
          product.data().status !== "reserved" ||
          product.data().reservedByRoomId !== roomId
        )
          throw new Error("상품의 예약 상태를 확인해주세요.");
      }
      validateFirebaseUser(userId);
      tx.set(completionRef, {
        ...completion,
        confirmedBy,
        deferredBy,
        updatedAt: serverTimestamp(),
      });
      for (const product of products)
        tx.update(product.ref, { status: "completed" });
    },
  );
}
