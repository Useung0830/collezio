import {
  acknowledgeProductRegistration,
  callRegistration,
  forgetRegistration,
  registrationUserId,
} from "@/features/products/api/productRegistration";
import { createPublicProfile } from "@/features/user/api/createPublicProfile";

import { firebaseAuth } from "@/lib/firebase";

export async function createProduct(registrationId: string) {
  const userId = await registrationUserId();
  await createPublicProfile(userId);
  if (firebaseAuth.currentUser?.uid !== userId)
    throw new Error("로그인 상태가 변경되었습니다.");
  const { productId } = await callRegistration<{ productId: string }>(
    "completeProductRegistration",
    { registrationId },
  );
  // An acknowledgement failure must not turn a confirmed product into a failed save.
  try {
    await acknowledgeProductRegistration(registrationId);
  } catch {
    /* The next visit can confirm the committed record. */
  }
  forgetRegistration(userId, registrationId);
  return productId;
}
