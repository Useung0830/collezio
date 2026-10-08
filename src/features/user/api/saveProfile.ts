import { httpsCallable } from "firebase/functions";

import { firebaseFunctions } from "@/lib/firebase";

type SaveProfileInput = {
  mode: "create" | "update";
  nickname: string;
  image?: { path: string; url: string };
};

export async function saveProfile(input: SaveProfileInput) {
  const save = httpsCallable<
    SaveProfileInput,
    { profile: unknown; previousPath?: string | null }
  >(firebaseFunctions, "saveProfile");
  const { data } = await save(input);
  return data;
}
