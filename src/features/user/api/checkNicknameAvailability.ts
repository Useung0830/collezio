import { httpsCallable } from "firebase/functions";

import { validateProfileNickname } from "@/features/user/utils/validateProfile";

import { firebaseFunctions } from "@/lib/firebase";

export async function checkNicknameAvailability(nickname: string) {
  const value = validateProfileNickname(nickname);
  const check = httpsCallable<{ nickname: string }, { available: boolean }>(
    firebaseFunctions,
    "checkNickname",
  );
  const { data } = await check({ nickname: value });
  return data.available;
}
