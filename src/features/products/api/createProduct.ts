import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import type { CreateProductInput } from "@/features/products/types/product";
import { createPublicProfile } from "@/features/user/api/createPublicProfile";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";

export async function createProduct({
  title,
  description,
  transaction,
  delivery,
  images,
}: CreateProductInput) {
  await firebaseAuth.authStateReady();
  const user = firebaseAuth.currentUser;

  if (!user) {
    throw new Error("로그인 후 상품을 등록해주세요.");
  }

  await createPublicProfile(user.uid);
  if (firebaseAuth.currentUser?.uid !== user.uid) {
    throw new Error("로그인 상태가 변경되었습니다.");
  }
  const productRef = await addDoc(collection(firebaseDb, "products"), {
    title: title.trim(),
    description: description.trim(),
    transaction,
    delivery,
    images,
    sellerId: user.uid,
    status: "available",
    createdAt: serverTimestamp(),
  });

  return productRef.id;
}
