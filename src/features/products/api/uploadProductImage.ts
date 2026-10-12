import { FirebaseError } from "firebase/app";
import { httpsCallable } from "firebase/functions";

import type { ProductImage } from "@/features/products/types/product";

import { firebaseApp, firebaseAuth, firebaseFunctions } from "@/lib/firebase";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function readImageBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("사진 파일을 읽을 수 없습니다."));
    reader.onabort = () => reject(new Error("사진 읽기가 취소되었습니다."));
    reader.onload = () => {
      if (typeof reader.result !== "string" || !reader.result.includes(",")) {
        reject(new Error("사진 파일을 읽을 수 없습니다."));
        return;
      }
      resolve(reader.result.slice(reader.result.indexOf(",") + 1));
    };
    reader.readAsDataURL(file);
  });
}

function parseUploadedImage(data: unknown, userId: string): ProductImage {
  if (
    !data ||
    typeof data !== "object" ||
    !("path" in data) ||
    typeof data.path !== "string" ||
    !("url" in data) ||
    typeof data.url !== "string" ||
    !data.path.startsWith(`products/${userId}/`) ||
    !/^[a-zA-Z0-9-]+$/.test(data.path.slice(`products/${userId}/`.length))
  ) {
    throw new Error("사진 저장 결과를 확인할 수 없습니다.");
  }
  const url = new URL(data.url);
  if (
    url.origin !== "https://firebasestorage.googleapis.com" ||
    url.username ||
    url.password ||
    url.pathname !==
      `/v0/b/${firebaseApp.options.storageBucket}/o/${encodeURIComponent(data.path)}` ||
    url.searchParams.get("alt") !== "media"
  ) {
    throw new Error("사진 저장 결과를 확인할 수 없습니다.");
  }
  return { path: data.path, url: data.url };
}

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

  const base64 = await readImageBase64(file);
  if (firebaseAuth.currentUser?.uid !== user.uid) {
    throw new Error("로그인 상태가 변경되었습니다.");
  }
  const upload = httpsCallable<
    { base64: string; contentType: string },
    unknown
  >(firebaseFunctions, "uploadProductImage", { timeout: 120_000 });
  try {
    const { data } = await upload({ base64, contentType: file.type });
    if (firebaseAuth.currentUser?.uid !== user.uid) {
      throw new Error("로그인 상태가 변경되었습니다.");
    }
    return parseUploadedImage(data, user.uid);
  } catch (error) {
    if (error instanceof FirebaseError) {
      if (
        [
          "functions/invalid-argument",
          "functions/failed-precondition",
          "functions/permission-denied",
          "functions/unauthenticated",
        ].includes(error.code)
      ) {
        throw new Error(error.message.replace(/\s+\[\d{3}\]$/, ""));
      }
      throw new Error(
        "사진 저장에 실패했습니다. 연결 상태를 확인하고 다시 시도해주세요.",
      );
    }
    throw error;
  }
}
