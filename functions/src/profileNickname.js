import { createHash } from "node:crypto";

import { HttpsError } from "firebase-functions/v2/https";

export function parseNickname(value) {
  if (
    typeof value !== "string" ||
    value.trim().length < 2 ||
    value.trim().length > 10
  ) {
    throw new HttpsError("invalid-argument", "닉네임은 2~10자로 입력해주세요.");
  }
  return value.trim();
}

export function getNicknameKey(nickname) {
  return createHash("sha256").update(nickname.trim()).digest("hex");
}

export async function isNicknameAvailable(db, nickname, userId) {
  const value = parseNickname(nickname);
  const [claim, profiles] = await Promise.all([
    db.doc(`nicknames/${getNicknameKey(value)}`).get(),
    db.collection("profiles").where("nickname", "==", value).limit(2).get(),
  ]);
  return (
    (!claim.exists || claim.get("userId") === userId) &&
    profiles.docs.every((profile) => profile.id === userId)
  );
}
