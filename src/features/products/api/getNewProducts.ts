import { collection, getDocs, orderBy, query } from "firebase/firestore";

import { parseProductListItem } from "@/features/products/utils/parseProduct";

import { firebaseDb } from "@/lib/firebase";

export async function getNewProducts() {
  const productsQuery = query(
    collection(firebaseDb, "products"),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(productsQuery);

  return snapshot.docs.map((document) =>
    parseProductListItem(document.id, document.data()),
  );
}
