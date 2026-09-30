import {
  collection,
  doc,
  getDocFromServer,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { deleteCommunityImages } from "@/features/community/api/deleteCommunityImages";
import { uploadCommunityImage } from "@/features/community/api/uploadCommunityImage";
import type { CreateCommunityPostInput } from "@/features/community/types/communityDocument";
import type { CommunityImage } from "@/features/community/types/communityDocument";
import { CommunityPostSaveError } from "@/features/community/utils/communityPostSaveError";
import { validateCommunityImages } from "@/features/community/utils/validateCommunityImages";
import { validateCommunityPost } from "@/features/community/utils/validateCommunityPost";

import { firebaseAuth, firebaseDb } from "@/lib/firebase";

export async function createCommunityPost(input: CreateCommunityPostInput) {
  await firebaseAuth.authStateReady();
  const user = firebaseAuth.currentUser;
  if (!user)
    throw new CommunityPostSaveError("로그인 후 게시글을 작성해주세요.");
  const content = validateCommunityPost(input);
  const files = input.files ?? [];
  validateCommunityImages(files);
  const document = doc(collection(firebaseDb, "communityPosts"));
  const attemptedPaths: string[] = [];
  const images: CommunityImage[] = [];
  let hasAttemptedSave = false;
  try {
    for (const file of files) {
      if (firebaseAuth.currentUser?.uid !== user.uid)
        throw new Error("인증 상태 변경");
      const path = `community/${user.uid}/${document.id}/${crypto.randomUUID()}`;
      // URL 조회 또는 업로드 응답이 실패해도 이미 생성된 파일을 정리합니다.
      attemptedPaths.push(path);
      images.push(await uploadCommunityImage(file, path));
    }
    if (firebaseAuth.currentUser?.uid !== user.uid)
      throw new Error("인증 상태 변경");
    hasAttemptedSave = true;
    await setDoc(document, {
      ...content,
      authorId: user.uid,
      images,
      likeCount: 0,
      viewCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return document.id;
  } catch {
    if (hasAttemptedSave) {
      try {
        // 저장 응답만 유실된 경우 게시된 사진을 삭제하지 않습니다.
        if ((await getDocFromServer(document)).exists()) return document.id;
      } catch {
        throw new CommunityPostSaveError(
          "저장 결과를 확인하지 못했습니다. 연결을 복구한 뒤 게시글 목록을 확인해주세요.",
        );
      }
    }
    const isCleaned = await deleteCommunityImages(attemptedPaths);
    throw new CommunityPostSaveError(
      isCleaned
        ? "게시글을 저장하지 못했습니다. 입력 내용은 유지됩니다. 연결 상태를 확인한 뒤 다시 시도해주세요."
        : "게시글 저장에 실패했고 일부 업로드 파일을 정리하지 못했습니다. 로그인과 연결 상태를 확인해주세요.",
    );
  }
}
