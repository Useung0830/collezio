import {
  collection,
  documentId,
  getDocsFromServer,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { validateFavoriteUser } from "@/features/favorite/utils/validateFavoriteUser";
import type { ProductListItem } from "@/features/products/types/product";
import { parseProductListItem } from "@/features/products/utils/parseProduct";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";

const FAVORITE_PRODUCT_BATCH_SIZE = 30;

export async function getFavoriteProducts(userId: string) {
  await firebaseAuth.authStateReady();
  validateFavoriteUser(userId);
  const favorites = await getDocsFromServer(
    query(
      collection(firebaseDb, "users", userId, "favorites"),
      orderBy("createdAt", "desc"),
    ),
  );
  validateFavoriteUser(userId);

  const products = new Map<string, ProductListItem>();
  // Firestore in 쿼리의 항목 제한에 맞춰 상품을 묶어서 조회합니다.
  for (
    let offset = 0;
    offset < favorites.size;
    offset += FAVORITE_PRODUCT_BATCH_SIZE
  ) {
    const productIds = favorites.docs
      .slice(offset, offset + FAVORITE_PRODUCT_BATCH_SIZE)
      .map((favorite) => favorite.id);
    const snapshot = await getDocsFromServer(
      query(
        collection(firebaseDb, "products"),
        where(documentId(), "in", productIds),
      ),
    );
    validateFavoriteUser(userId);
    for (const product of snapshot.docs) {
      products.set(
        product.id,
        parseProductListItem(product.id, product.data()),
      );
    }
  }

  // 삭제된 상품은 제외하고 찜 기록의 최신순을 유지합니다.
  return favorites.docs.flatMap((favorite) => {
    const product = products.get(favorite.id);
    return product ? [product] : [];
  });
}
