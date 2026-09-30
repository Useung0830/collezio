import {
  doc,
  getDocFromServer,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { deleteCommunityImages } from "@/features/community/api/deleteCommunityImages";
import { getCommunityPost } from "@/features/community/api/getCommunityPost";
import { uploadCommunityImage } from "@/features/community/api/uploadCommunityImage";
import type {
  CommunityImage,
  CreateCommunityPostInput,
} from "@/features/community/types/communityDocument";
import { CommunityPostSaveError } from "@/features/community/utils/communityPostSaveError";
import { getCommunityImagePaths } from "@/features/community/utils/getCommunityImagePaths";
import { parseCommunityPost } from "@/features/community/utils/parseCommunityPost";
import { validateCommunityImages } from "@/features/community/utils/validateCommunityImages";
import { validateCommunityPost } from "@/features/community/utils/validateCommunityPost";

import { firebaseDb } from "@/lib/firebase";
import { validateFirebaseUser } from "@/lib/validateFirebaseUser";

type UpdateCommunityPostInput = CreateCommunityPostInput & {
  postId: string;
  userId: string;
  version: string;
  retainedPaths: string[];
};

export async function updateCommunityPost(input: UpdateCommunityPostInput) {
  validateFirebaseUser(input.userId);
  const content = validateCommunityPost(input);
  const files = input.files ?? [];
  validateCommunityImages(files);
  const post = await getCommunityPost(input.postId);
  if (!post || post.authorId !== input.userId)
    throw new CommunityPostSaveError("본인 게시글만 수정할 수 있습니다.");
  if (post.version !== input.version)
    throw new CommunityPostSaveError(
      "다른 곳에서 수정된 글입니다. 취소 후 최신 내용을 다시 열어주세요.",
    );
  const retained = post.images.filter((image) =>
    input.retainedPaths.includes(image.path),
  );
  if (
    new Set(input.retainedPaths).size !== input.retainedPaths.length ||
    retained.length !== input.retainedPaths.length ||
    retained.length + files.length > 10
  )
    throw new CommunityPostSaveError(
      "기존 사진과 새 사진을 합쳐 최대 10장까지 첨부할 수 있습니다.",
    );
  const reference = doc(firebaseDb, "communityPosts", input.postId);
  const attemptedPaths: string[] = [];
  const images: CommunityImage[] = [...retained];
  let removedPaths: string[] = [];
  let hasAttemptedSave = false;
  try {
    for (const file of files) {
      validateFirebaseUser(input.userId);
      const path = `community/${input.userId}/${input.postId}/${crypto.randomUUID()}`;
      attemptedPaths.push(path);
      images.push(await uploadCommunityImage(file, path));
    }
    hasAttemptedSave = true;
    await runTransaction(firebaseDb, async (transaction) => {
      validateFirebaseUser(input.userId);
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists())
        throw new CommunityPostSaveError("삭제된 게시글입니다.");
      const latest = parseCommunityPost(snapshot.id, snapshot.data());
      if (latest.authorId !== input.userId || latest.version !== input.version)
        throw new CommunityPostSaveError(
          "다른 곳에서 수정된 글입니다. 취소 후 최신 내용을 다시 열어주세요.",
        );
      removedPaths = getCommunityImagePaths(
        snapshot.data().images,
        input.userId,
        input.postId,
      ).filter((path) => !input.retainedPaths.includes(path));
      transaction.update(reference, {
        ...content,
        images,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    let hasSaved = false;
    if (hasAttemptedSave && !(error instanceof CommunityPostSaveError)) {
      try {
        const latest = await getDocFromServer(reference);
        const data = latest.data();
        hasSaved =
          data?.title === content.title &&
          data?.content === content.content &&
          Array.isArray(data?.images) &&
          data.images.length === images.length &&
          images.every(
            (image, index) =>
              data.images[index]?.path === image.path &&
              data.images[index]?.url === image.url,
          );
      } catch {
        throw new CommunityPostSaveError(
          "수정 결과를 확인하지 못했습니다. 연결을 복구한 뒤 게시글을 확인해주세요.",
        );
      }
    }
    if (!hasSaved) {
      const isCleaned = await deleteCommunityImages(attemptedPaths);
      if (!isCleaned)
        throw new CommunityPostSaveError(
          "수정에 실패했고 일부 업로드 파일을 정리하지 못했습니다. 연결 상태를 확인해주세요.",
        );
      if (error instanceof CommunityPostSaveError) throw error;
      throw new CommunityPostSaveError(
        "수정하지 못했습니다. 입력 내용은 유지됩니다. 연결 상태를 확인하고 다시 시도해주세요.",
      );
    }
  }
  const isCleaned = await deleteCommunityImages(removedPaths);
  return { postId: input.postId, isCleaned };
}
