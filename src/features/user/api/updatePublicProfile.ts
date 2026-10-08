import { doc, runTransaction } from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import { parsePublicProfile } from "@/features/user/utils/parsePublicProfile";
import {
  validateProfileImage,
  validateProfileNickname,
} from "@/features/user/utils/validateProfile";

import { firebaseAuth, firebaseDb, firebaseStorage } from "@/lib/firebase";

type UpdatePublicProfileInput = {
  userId: string;
  nickname: string;
  image: File | null;
};

export async function updatePublicProfile({
  userId,
  nickname,
  image,
}: UpdatePublicProfileInput) {
  const normalizedNickname = validateProfileNickname(nickname);
  if (image) validateProfileImage(image);
  await firebaseAuth.authStateReady();
  if (firebaseAuth.currentUser?.uid !== userId) {
    throw new Error("로그인 상태가 변경되었습니다. 다시 로그인해주세요.");
  }

  const imageRef = image
    ? ref(firebaseStorage, `profiles/${userId}/${crypto.randomUUID()}`)
    : null;
  try {
    let imageUrl: string | undefined;
    if (image && imageRef) {
      await uploadBytes(imageRef, image, { contentType: image.type });
      const url = new URL(await getDownloadURL(imageRef));
      // 에뮬레이터에서도 DB에는 운영 환경과 같은 주소 형식을 저장합니다.
      url.protocol = "https:";
      url.hostname = "firebasestorage.googleapis.com";
      url.port = "";
      imageUrl = url.toString();
    }

    const result = await runTransaction(firebaseDb, async (transaction) => {
      if (firebaseAuth.currentUser?.uid !== userId) {
        throw new Error("로그인 상태가 변경되었습니다.");
      }
      const reference = doc(firebaseDb, "profiles", userId);
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists()) throw new Error("프로필을 다시 불러와주세요.");
      const data = snapshot.data();
      const changes = {
        nickname: normalizedNickname,
        ...(imageUrl && imageRef
          ? { imageUrl, imagePath: imageRef.fullPath }
          : {}),
      };
      transaction.update(reference, changes);
      return {
        profile: parsePublicProfile(userId, { ...data, ...changes }),
        previousPath: data.imagePath,
      };
    });

    if (
      imageRef &&
      typeof result.previousPath === "string" &&
      result.previousPath.startsWith(`profiles/${userId}/`)
    ) {
      await deleteObject(ref(firebaseStorage, result.previousPath)).catch(
        () => undefined,
      );
    }
    return result.profile;
  } catch (error) {
    // 저장 응답만 유실된 경우에도 현재 사용 중인 사진은 Storage 규칙이 보호합니다.
    if (imageRef) await deleteObject(imageRef).catch(() => undefined);
    throw error;
  }
}
