import { collection, getDocs, query, where } from "firebase/firestore";

import { parseMyProduct } from "@/features/products/utils/parseMyProduct";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";

export async function getMyProducts(userId: string) {
  await firebaseAuth.authStateReady();

  if (!userId || firebaseAuth.currentUser?.uid !== userId) {
    throw new Error("로그인 후 보유품을 확인해주세요.");
  }

  const productsQuery = query(
    collection(firebaseDb, "products"),
    where("sellerId", "==", userId),
  );
  const snapshot = await getDocs(productsQuery);

  if (firebaseAuth.currentUser?.uid !== userId) {
    throw new Error("로그인 상태가 변경되었습니다.");
  }

  return snapshot.docs
    .map((document) => parseMyProduct(document.id, document.data()))
    .sort((first, second) => {
      const firstTime = first.createdAt ? Date.parse(first.createdAt) : 0;
      const secondTime = second.createdAt ? Date.parse(second.createdAt) : 0;
      return secondTime - firstTime || first.id.localeCompare(second.id);
    });
}
