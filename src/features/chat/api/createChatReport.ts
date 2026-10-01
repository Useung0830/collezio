import { doc, runTransaction, serverTimestamp } from "firebase/firestore";

import {
  CHAT_REPORT_REASONS,
  MAX_CHAT_REPORT_LENGTH,
} from "@/features/chat/constants/chatReport";
import type { CreateChatReportInput } from "@/features/chat/types/chatModeration";
import { validateChatDocumentId } from "@/features/chat/utils/validateChatDocumentId";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";
import { validateFirebaseUser } from "@/lib/validateFirebaseUser";

export async function createChatReport(input: CreateChatReportInput) {
  const { userId, partnerId, roomId, reportId, reason } = input;
  for (const id of [userId, partnerId, roomId, reportId])
    validateChatDocumentId(id);
  const details = input.details.trim();
  if (
    !CHAT_REPORT_REASONS.includes(reason) ||
    details.length > MAX_CHAT_REPORT_LENGTH ||
    (reason === "기타" && !details)
  ) {
    throw new Error("신고 사유와 상세 내용을 확인해주세요.");
  }
  await firebaseAuth.authStateReady();
  validateFirebaseUser(userId);
  const ref = doc(firebaseDb, "users", userId, "chatReports", reportId);
  await runTransaction(firebaseDb, async (transaction) => {
    validateFirebaseUser(userId);
    const existing = await transaction.get(ref);
    if (existing.exists()) {
      const data = existing.data();
      if (
        data.partnerId !== partnerId ||
        data.roomId !== roomId ||
        data.reason !== reason ||
        data.details !== details
      ) {
        throw new Error("이미 접수된 신고와 요청 내용이 다릅니다.");
      }
      return;
    }
    transaction.set(ref, {
      partnerId,
      roomId,
      reason,
      details,
      createdAt: serverTimestamp(),
    });
  });
  validateFirebaseUser(userId);
}
