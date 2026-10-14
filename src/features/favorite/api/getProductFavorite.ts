import { doc, getDocFromServer } from "firebase/firestore";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";
import { validateFirebaseUser } from "@/lib/validateFirebaseUser";

export async function getProductFavorite(productId: string, userId: string) {
  await firebaseAuth.authStateReady();
  validateFirebaseUser(userId);

  const snapshot = await getDocFromServer(
    doc(firebaseDb, "users", userId, "favorites", productId),
  );
  validateFirebaseUser(userId);
  return snapshot.exists();
}
