import { doc, type Transaction } from "firebase/firestore";

import { firebaseDb } from "@/lib/firebase";

export async function validateChatAccess(
  transaction: Transaction,
  userId: string,
  partnerId: string,
) {
  const [mine, partner] = await Promise.all([
    transaction.get(doc(firebaseDb, "users", userId, "chatBlocks", partnerId)),
    transaction.get(doc(firebaseDb, "users", partnerId, "chatBlocks", userId)),
  ]);
  if (mine.exists() || partner.exists())
    throw new Error("메시지를 보낼 수 없는 대화입니다.");
}
