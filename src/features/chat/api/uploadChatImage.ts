import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getMetadata, ref, uploadBytes } from "firebase/storage";

import { validateChatImage } from "@/features/chat/utils/validateChatImage";

import { firebaseDb, firebaseStorage } from "@/lib/firebase";
import { validateFirebaseUser } from "@/lib/validateFirebaseUser";

export async function uploadChatImage(
  roomId: string,
  userId: string,
  messageId: string,
  file: File,
  index?: number,
) {
  validateChatImage(file);
  validateFirebaseUser(userId);
  const path = `chat/${roomId}/${userId}/${messageId}${index === undefined ? "" : `/${index}`}`;
  const imageRef = ref(firebaseStorage, path);
  const hash = Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", await file.arrayBuffer()),
    ),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
  // A lost upload response can be retried without overwriting an existing object.
  try {
    const existing = await getMetadata(imageRef);
    if (
      existing.size !== file.size ||
      existing.contentType !== file.type ||
      existing.customMetadata?.sha256 !== hash
    )
      throw new Error("이미지 전송 정보가 일치하지 않습니다.");
    return path;
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !("code" in error) ||
      error.code !== "storage/object-not-found"
    )
      throw error;
  }
  const ticket = doc(
    firebaseDb,
    "chatRooms",
    roomId,
    "imageUploads",
    messageId,
  );
  validateFirebaseUser(userId);
  await setDoc(ticket, { senderId: userId, createdAt: serverTimestamp() });
  await uploadBytes(imageRef, new Uint8Array(await file.arrayBuffer()), {
    contentType: file.type,
    customMetadata: { sha256: hash },
  });
  validateFirebaseUser(userId);
  return path;
}
