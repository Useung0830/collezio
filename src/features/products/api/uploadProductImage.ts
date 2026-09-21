import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import type { ProductImage } from "@/features/products/types/product";

import { firebaseAuth, firebaseStorage } from "@/lib/firebase";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadProductImage(file: File): Promise<ProductImage> {
  await firebaseAuth.authStateReady();
  const user = firebaseAuth.currentUser;

  if (!user) {
    throw new Error("로그인 후 사진을 등록해주세요.");
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("JPG, PNG, WebP 사진만 등록할 수 있습니다.");
  }

  if (file.size === 0 || file.size > MAX_IMAGE_SIZE) {
    throw new Error("사진은 빈 파일이 아닌 5MB 이하 파일이어야 합니다.");
  }

  const path = `products/${user.uid}/${crypto.randomUUID()}`;
  const imageRef = ref(firebaseStorage, path);

  await uploadBytes(imageRef, file);
  const url = await getDownloadURL(imageRef);

  return { url, path };
}
