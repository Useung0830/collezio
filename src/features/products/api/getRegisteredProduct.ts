import { doc, getDoc } from "firebase/firestore";

import { parseRegisteredProduct } from "@/features/products/utils/parseProduct";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";

export async function getRegisteredProduct(
  productId: string,
  userId: string | null,
) {
  await firebaseAuth.authStateReady();
  if ((firebaseAuth.currentUser?.uid ?? null) !== userId) {
    throw new Error("로그인 상태가 변경되었습니다.");
  }
  const snapshot = await getDoc(doc(firebaseDb, "products", productId));
  if ((firebaseAuth.currentUser?.uid ?? null) !== userId) {
    throw new Error("로그인 상태가 변경되었습니다.");
  }
  return snapshot.exists()
    ? parseRegisteredProduct(snapshot.id, snapshot.data())
    : null;
}
