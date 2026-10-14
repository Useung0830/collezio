import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { firebaseStorage } from "@/lib/firebase";

export async function uploadCommunityImage(file: File, path: string) {
  const imageRef = ref(firebaseStorage, path);
  await uploadBytes(imageRef, file, { contentType: file.type });
  const url = new URL(await getDownloadURL(imageRef));
  // DB 주소는 환경에 관계없이 동일한 형식으로 저장합니다.
  url.protocol = "https:";
  url.hostname = "firebasestorage.googleapis.com";
  url.port = "";
  return { path, url: url.toString() };
}
