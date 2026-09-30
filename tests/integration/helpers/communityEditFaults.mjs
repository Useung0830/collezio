import { runTransaction as actualRunTransaction } from "firebase/firestore";

import { deleteCommunityImages as actualDelete } from "../../../src/features/community/api/deleteCommunityImages.ts";

export { doc, getDocFromServer, serverTimestamp } from "firebase/firestore";

export const editFaults = {
  failure: null,
  beforeTransaction: null,
  failCleanup: false,
};
export async function runTransaction(...args) {
  await editFaults.beforeTransaction?.();
  if (editFaults.failure === "before") throw new Error("test commit failure");
  const result = await actualRunTransaction(...args);
  if (editFaults.failure === "after") throw new Error("test response lost");
  return result;
}
export async function deleteCommunityImages(paths) {
  if (editFaults.failCleanup) return false;
  return actualDelete(paths);
}
