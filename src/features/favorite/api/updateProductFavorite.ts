import { FirebaseError } from "firebase/app";
import {
  doc,
  getDocFromServer,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { validateFavoriteUser } from "@/features/favorite/utils/validateFavoriteUser";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";

interface UpdateProductFavoriteInput {
  productId: string;
  userId: string;
  isFavorite: boolean;
}

const MAX_FAVORITE_ATTEMPTS = 3;

export async function updateProductFavorite({
  productId,
  userId,
  isFavorite,
}: UpdateProductFavoriteInput) {
  await firebaseAuth.authStateReady();
  validateFavoriteUser(userId);

  const productRef = doc(firebaseDb, "products", productId);
  const favoriteRef = doc(firebaseDb, "users", userId, "favorites", productId);
  let lastReadState: { favoriteCount: number; isFavorite: boolean } | undefined;
  const commitFavorite = () =>
    runTransaction(firebaseDb, async (transaction) => {
      validateFavoriteUser(userId);
      const product = await transaction.get(productRef);
      const favorite = await transaction.get(favoriteRef);
      validateFavoriteUser(userId);

      if (!product.exists()) {
        throw new Error("상품을 찾을 수 없습니다.");
      }

      // 기존 상품에는 favoriteCount가 없으므로 첫 찜부터 집계를 시작합니다.
      const data = product.data();
      const favoriteCount: unknown =
        data.favoriteCount === undefined ? 0 : data.favoriteCount;
      if (
        typeof favoriteCount !== "number" ||
        !Number.isSafeInteger(favoriteCount) ||
        favoriteCount < 0
      ) {
        throw new Error("상품의 찜 수를 확인할 수 없습니다.");
      }
      lastReadState = { favoriteCount, isFavorite: favorite.exists() };

      // 토글 대신 목표 상태를 받아 재시도나 중복 요청으로 두 번 변경하지 않습니다.
      if (favorite.exists() === isFavorite) {
        return { isFavorite, favoriteCount };
      }

      const nextCount = favoriteCount + (isFavorite ? 1 : -1);
      if (!Number.isSafeInteger(nextCount) || nextCount < 0) {
        throw new Error("상품의 찜 수를 확인할 수 없습니다.");
      }

      if (isFavorite) {
        transaction.set(favoriteRef, { createdAt: serverTimestamp() });
      } else {
        transaction.delete(favoriteRef);
      }
      transaction.update(productRef, { favoriteCount: nextCount });
      return { isFavorite, favoriteCount: nextCount };
    });

  for (let attempt = 1; ; attempt += 1) {
    try {
      const result = await commitFavorite();
      validateFavoriteUser(userId);
      return result;
    } catch (error) {
      if (
        !(error instanceof FirebaseError) ||
        error.code !== "permission-denied" ||
        !lastReadState ||
        attempt >= MAX_FAVORITE_ATTEMPTS
      ) {
        throw error;
      }

      // 동시 커밋은 충돌 응답보다 먼저 규칙 검사에서 거부될 수 있습니다.
      // 읽었던 상태가 실제로 바뀐 경우에만 새 트랜잭션으로 재시도합니다.
      validateFavoriteUser(userId);
      const [product, favorite] = await Promise.all([
        getDocFromServer(productRef),
        getDocFromServer(favoriteRef),
      ]);
      validateFavoriteUser(userId);
      if (
        product.exists() &&
        (product.data().favoriteCount ?? 0) === lastReadState.favoriteCount &&
        favorite.exists() === lastReadState.isFavorite
      ) {
        throw error;
      }
    }
  }
}
