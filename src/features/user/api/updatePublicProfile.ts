import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import { checkNicknameAvailability } from "@/features/user/api/checkNicknameAvailability";
import { saveProfile } from "@/features/user/api/saveProfile";
import { parsePublicProfile } from "@/features/user/utils/parsePublicProfile";
import {
  validateProfileImage,
  validateProfileNickname,
} from "@/features/user/utils/validateProfile";

import { firebaseAuth, firebaseStorage } from "@/lib/firebase";

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
  if (!(await checkNicknameAvailability(normalizedNickname))) {
    throw new Error("이미 사용 중인 닉네임입니다.");
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

    if (firebaseAuth.currentUser?.uid !== userId) {
      throw new Error("로그인 상태가 변경되었습니다.");
    }
    const result = await saveProfile({
      mode: "update",
      nickname: normalizedNickname,
      ...(imageUrl && imageRef
        ? { image: { url: imageUrl, path: imageRef.fullPath } }
        : {}),
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
    return parsePublicProfile(userId, result.profile);
  } catch (error) {
    // 저장 응답만 유실된 경우에도 현재 사용 중인 사진은 Storage 규칙이 보호합니다.
    if (imageRef) await deleteObject(imageRef).catch(() => undefined);
    throw error;
  }
}
