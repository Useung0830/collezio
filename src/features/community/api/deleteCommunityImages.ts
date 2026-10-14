import { deleteObject, ref } from "firebase/storage";

import { firebaseStorage } from "@/lib/firebase";

export async function deleteCommunityImages(paths: string[]) {
  const results = await Promise.allSettled(
    paths.map(async (path) => {
      try {
        await deleteObject(ref(firebaseStorage, path));
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "storage/object-not-found"
        )
          return;
        throw error;
      }
    }),
  );
  return results.every((result) => result.status === "fulfilled");
}
