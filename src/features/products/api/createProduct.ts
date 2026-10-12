import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import type { CreateProductInput } from "@/features/products/types/product";
import { createPublicProfile } from "@/features/user/api/createPublicProfile";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";

export async function createProduct(
  { title, description, transaction, delivery, images }: CreateProductInput,
  expectedUserId: string,
  productId = doc(collection(firebaseDb, "products")).id,
) {
  await firebaseAuth.authStateReady();
  const user = firebaseAuth.currentUser;

  if (!user) {
    throw new Error("로그인 후 상품을 등록해주세요.");
  }
  if (user.uid !== expectedUserId) {
    throw new Error("로그인 상태가 변경되었습니다.");
  }

  await createPublicProfile(user.uid);
  if (firebaseAuth.currentUser?.uid !== user.uid) {
    throw new Error("로그인 상태가 변경되었습니다.");
  }
  const productRef = doc(firebaseDb, "products", productId);
  await runTransaction(firebaseDb, async (transactionRef) => {
    const existing = await transactionRef.get(productRef);
    if (existing.exists()) {
      if (existing.data().sellerId !== user.uid)
        throw new Error("상품 등록 결과를 확인할 수 없습니다.");
      return;
    }
    if (firebaseAuth.currentUser?.uid !== user.uid)
      throw new Error("로그인 상태가 변경되었습니다.");
    transactionRef.set(productRef, {
      title: title.trim(),
      description: description.trim(),
      transaction,
      delivery,
      images,
      sellerId: user.uid,
      status: "available",
      favoriteCount: 0,
      createdAt: serverTimestamp(),
    });
  });

  return productRef.id;
}
