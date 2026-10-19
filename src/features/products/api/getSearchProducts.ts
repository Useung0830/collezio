import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";

import type { ProductCategory } from "@/features/products/constants/productCategories";
import { normalizeProductSearch } from "@/features/products/utils/normalizeProductSearch";
import { parseProductListItem } from "@/features/products/utils/parseProduct";

import { firebaseDb } from "@/lib/firebase";

const SEARCH_PAGE_SIZE = 24;

export async function getSearchProducts(
  category: ProductCategory | null,
  searchText: string,
  cursor: QueryDocumentSnapshot<DocumentData> | null,
) {
  const searchTerm = normalizeProductSearch(searchText);
  const productsQuery = query(
    collection(firebaseDb, "products"),
    ...(category ? [where("category", "==", category)] : []),
    ...(searchTerm ? [where("titleTerms", "array-contains", searchTerm)] : []),
    orderBy("createdAt", "desc"),
    ...(cursor ? [startAfter(cursor)] : []),
    limit(SEARCH_PAGE_SIZE),
  );
  const snapshot = await getDocs(productsQuery);

  return {
    products: snapshot.docs.map((document) =>
      parseProductListItem(document.id, document.data()),
    ),
    nextCursor:
      snapshot.size === SEARCH_PAGE_SIZE
        ? snapshot.docs[snapshot.docs.length - 1]
        : null,
  };
}
