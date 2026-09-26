import { doc, getDocFromServer } from "firebase/firestore";

import { validateFavoriteUser } from "@/features/favorite/utils/validateFavoriteUser";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";

export async function getProductFavorite(productId: string, userId: string) {
  await firebaseAuth.authStateReady();
  validateFavoriteUser(userId);

  const snapshot = await getDocFromServer(
    doc(firebaseDb, "users", userId, "favorites", productId),
  );
  validateFavoriteUser(userId);
  return snapshot.exists();
}
