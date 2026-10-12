import { FirebaseError } from "firebase/app";
import { collection, doc } from "firebase/firestore";

import { createProduct } from "@/features/products/api/createProduct";
import { deleteProductImages } from "@/features/products/api/deleteProductImages";
import { uploadProductImage } from "@/features/products/api/uploadProductImage";
import { createProductRegistration } from "@/features/products/utils/createProductRegistration";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";

export function createRegisterProduct() {
  return createProductRegistration({
    getUserId: async () => {
      await firebaseAuth.authStateReady();
      const userId = firebaseAuth.currentUser?.uid;
      if (!userId) throw new Error("로그인 후 상품을 등록해주세요.");
      return userId;
    },
    createId: () => doc(collection(firebaseDb, "products")).id,
    uploadImage: uploadProductImage,
    deleteImages: deleteProductImages,
    saveProduct: createProduct,
    isDefiniteFailure: (error) =>
      error instanceof FirebaseError &&
      ["permission-denied", "invalid-argument", "unauthenticated"].includes(
        error.code,
      ),
  });
}
