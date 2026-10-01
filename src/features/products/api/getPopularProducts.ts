import { collection, getDocs } from "firebase/firestore";

import { parseProductListItem } from "@/features/products/utils/parseProduct";
import { selectPopularProducts } from "@/features/products/utils/selectPopularProducts";

import { firebaseDb } from "@/lib/firebase";

export async function getPopularProducts() {
  // 찜 수가 없는 기존 상품도 0개로 포함하기 위해 정렬 전에 전체 문서를 읽습니다.
  const snapshot = await getDocs(collection(firebaseDb, "products"));

  return selectPopularProducts(
    snapshot.docs.map((document) =>
      parseProductListItem(document.id, document.data()),
    ),
  );
}
