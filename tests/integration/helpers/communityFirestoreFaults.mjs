import { setDoc as saveDocument } from "firebase/firestore";

export {
  collection,
  doc,
  getDocFromServer,
  serverTimestamp,
} from "firebase/firestore";
export const saves = { failure: null };

export async function setDoc(reference, data) {
  if (saves.failure === "before") throw new Error("저장 실패 테스트");
  await saveDocument(reference, data);
  if (saves.failure === "after") throw new Error("저장 응답 유실 테스트");
}
