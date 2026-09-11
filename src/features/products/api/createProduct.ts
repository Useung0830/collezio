import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import type { CreateProductInput } from "@/features/products/types/product";

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
