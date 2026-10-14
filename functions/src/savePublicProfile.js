import { FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

import { getNicknameKey, parseNickname } from "./profileNickname.js";

function parseProfileImage(image, userId, bucketName) {
  if (image === undefined) return {};
  if (
    !image ||
    typeof image.path !== "string" ||
    typeof image.url !== "string" ||
    !image.path.startsWith(`profiles/${userId}/`) ||
    !/^[a-zA-Z0-9-]+$/.test(image.path.slice(`profiles/${userId}/`.length))
  ) {
    throw new HttpsError(
      "invalid-argument",
      "프로필 사진 정보를 확인해주세요.",
    );
  }
  let url;
  try {
    url = new URL(image.url);
  } catch {
    throw new HttpsError(
      "invalid-argument",
      "프로필 사진 주소를 확인해주세요.",
    );
  }
  if (
    url.origin !== "https://firebasestorage.googleapis.com" ||
    url.username ||
    url.password ||
    url.pathname !==
      `/v0/b/${bucketName}/o/${encodeURIComponent(image.path)}` ||
    url.searchParams.get("alt") !== "media" ||
    image.url.length > 2048
  ) {
    throw new HttpsError(
      "invalid-argument",
      "프로필 사진 주소를 확인해주세요.",
    );
  }
  return { imageUrl: image.url, imagePath: image.path };
}

export async function savePublicProfile(db, userId, input, bucketName) {
  if (!userId) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
  if (!input || !["create", "update"].includes(input.mode)) {
    throw new HttpsError("invalid-argument", "프로필 요청을 확인해주세요.");
  }
  const nickname = parseNickname(input.nickname);
  const image = parseProfileImage(input.image, userId, bucketName);
  if (input.mode === "create" && input.image !== undefined) {
    throw new HttpsError("invalid-argument", "가입 후 사진을 설정해주세요.");
  }
  const profileRef = db.doc(`profiles/${userId}`);
  const claimRef = db.doc(`nicknames/${getNicknameKey(nickname)}`);
  return db.runTransaction(async (transaction) => {
    const [profile, withdrawal, claim, duplicates] = await Promise.all([
      transaction.get(profileRef),
      transaction.get(db.doc(`withdrawalRequests/${userId}`)),
      transaction.get(claimRef),
      transaction.get(
        db.collection("profiles").where("nickname", "==", nickname).limit(2),
      ),
    ]);
    if (withdrawal.exists)
      throw new HttpsError(
        "permission-denied",
        "탈퇴 처리 중에는 프로필을 수정할 수 없습니다.",
      );
    // 생성 재시도는 이미 저장된 프로필을 덮어쓰지 않습니다.
    if (input.mode === "create" && profile.exists)
      return { profile: profile.data() };
    if (input.mode === "update" && !profile.exists)
      throw new HttpsError("not-found", "프로필을 다시 불러와주세요.");
    if (
      (claim.exists && claim.get("userId") !== userId) ||
      duplicates.docs.some((other) => other.id !== userId)
    ) {
      throw new HttpsError("already-exists", "이미 사용 중인 닉네임입니다.");
    }
    const previous = profile.data();
    const previousClaimRef = previous?.nickname
      ? db.doc(`nicknames/${getNicknameKey(previous.nickname)}`)
      : null;
    const previousClaim =
      previousClaimRef && previousClaimRef.path !== claimRef.path
        ? await transaction.get(previousClaimRef)
        : null;
    const changes = { nickname, ...image };
    if (profile.exists) transaction.update(profileRef, changes);
    else
      transaction.create(profileRef, {
        ...changes,
        imageUrl: null,
        bio: "",
        createdAt: FieldValue.serverTimestamp(),
      });
    transaction.set(claimRef, { userId });
    if (previousClaim?.get("userId") === userId)
      transaction.delete(previousClaimRef);
    return {
      profile: { ...(previous ?? { imageUrl: null, bio: "" }), ...changes },
      previousPath: previous?.imagePath ?? null,
    };
  });
}
