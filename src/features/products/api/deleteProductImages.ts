import { deleteObject, ref } from "firebase/storage";

import { firebaseAuth, firebaseStorage } from "@/lib/firebase";

export async function deleteProductImages(paths: string[], userId: string) {
  const results = await Promise.allSettled(
    paths.map(async (path) => {
      if (
        firebaseAuth.currentUser?.uid !== userId ||
        !path.startsWith(`products/${userId}/`) ||
        !/^[a-zA-Z0-9-]+$/.test(path.slice(`products/${userId}/`.length))
      ) {
        throw new Error("사진을 정리할 수 없습니다.");
      }
      try {
        await deleteObject(ref(firebaseStorage, path));
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "storage/object-not-found"
        )
          return;
        throw error;
      }
    }),
  );
  return paths.filter((_, index) => results[index].status === "rejected");
}
