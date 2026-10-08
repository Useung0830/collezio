import { doc, serverTimestamp } from "firebase/firestore";

import { runTradeCompletionTransaction } from "@/features/chat/api/runTradeCompletionTransaction";
import { validateChatAccess } from "@/features/chat/api/validateChatAccess";
import type { TradeReview } from "@/features/chat/types/tradeCompletion";
import {
  parseTradeCompletion,
  parseTradeReview,
} from "@/features/chat/utils/parseTradeCompletion";
import { validateChatDocumentId } from "@/features/chat/utils/validateChatDocumentId";

import { firebaseDb } from "@/lib/firebase";
import { validateFirebaseUser } from "@/lib/validateFirebaseUser";

export async function createTradeReview(
  roomId: string,
  userId: string,
  proposalId: string,
  input: TradeReview,
) {
  [roomId, userId, proposalId].forEach(validateChatDocumentId);
  const review = parseTradeReview({ ...input });
  const roomRef = doc(firebaseDb, "chatRooms", roomId);
  const completionRef = doc(roomRef, "completions", proposalId);
  const reviewRef = doc(completionRef, "reviews", userId);
  await runTradeCompletionTransaction(
    completionRef,
    async (tx, completionSnapshot) => {
      validateFirebaseUser(userId);
      const [roomSnapshot, existing] = await Promise.all([
        tx.get(roomRef),
        tx.get(reviewRef),
      ]);
      const room = roomSnapshot.data();
      if (!room || ![room.requesterId, room.sellerId].includes(userId))
        throw new Error("후기를 작성할 권한이 없습니다.");
      const completion = parseTradeCompletion(completionSnapshot.data());
      if (
        ![room.requesterId, room.sellerId].every((id) =>
          completion.confirmedBy.includes(id),
        )
      )
        throw new Error(
          "두 분 모두 거래 완료를 눌러야 후기를 작성할 수 있습니다.",
        );
      if (existing.exists()) {
        const previous = parseTradeReview(existing.data());
        if (
          previous.rating === review.rating &&
          previous.content === review.content
        )
          return;
        throw new Error("이미 작성한 후기는 변경할 수 없습니다.");
      }
      await validateChatAccess(tx, room.requesterId, room.sellerId);
      validateFirebaseUser(userId);
      tx.set(reviewRef, { ...review, createdAt: serverTimestamp() });
      tx.update(completionRef, {
        reviewedBy: [...completion.reviewedBy, userId],
        updatedAt: serverTimestamp(),
      });
    },
  );
}
