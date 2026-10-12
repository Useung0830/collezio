import { httpsCallable } from "firebase/functions";

import type { ProductRegistration } from "@/features/products/types/productRegistration";

import { firebaseAuth, firebaseFunctions } from "@/lib/firebase";

const key = (userId: string) => "collezio:product-registration:" + userId;
export async function registrationUserId() {
  await firebaseAuth.authStateReady();
  const id = firebaseAuth.currentUser?.uid;
  if (!id) throw new Error("로그인 후 상품을 등록해주세요.");
  return id;
}
export function rememberRegistration(userId: string, id: string) {
  // The server owner record still supports recovery when browser storage is unavailable.
  try {
    localStorage.setItem(key(userId), id);
  } catch {
    /* Storage may be disabled. */
  }
}
export function forgetRegistration(userId: string, id: string) {
  try {
    if (localStorage.getItem(key(userId)) === id)
      localStorage.removeItem(key(userId));
  } catch {
    /* Server cleanup does not depend on browser storage. */
  }
}
export async function callRegistration<T>(
  name: string,
  input: unknown,
): Promise<T> {
  const uid = await registrationUserId();
  const call = httpsCallable<unknown, T>(firebaseFunctions, name, {
    timeout: 120_000,
  });
  const result = await call(input);
  if (firebaseAuth.currentUser?.uid !== uid)
    throw new Error("로그인 상태가 변경되었습니다.");
  return result.data;
}
export async function getPendingProductRegistration(): Promise<ProductRegistration | null> {
  const uid = await registrationUserId();
  let id: string | null = null;
  try {
    id = localStorage.getItem(key(uid));
  } catch {
    /* Use the server owner record. */
  }
  if (
    id &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
      id,
    )
  ) {
    forgetRegistration(uid, id);
    id = null;
  }
  let result = await callRegistration<ProductRegistration | null>(
    "getProductRegistration",
    { registrationId: id },
  );
  if (!result && id) {
    forgetRegistration(uid, id);
    result = await callRegistration<ProductRegistration | null>(
      "getProductRegistration",
      { registrationId: null },
    );
  }
  if (result) rememberRegistration(uid, result.id);
  return result;
}
export async function cancelProductRegistration(id: string) {
  const uid = await registrationUserId();
  await callRegistration("cancelProductRegistration", { registrationId: id });
  forgetRegistration(uid, id);
}

export async function acknowledgeProductRegistration(id: string) {
  const uid = await registrationUserId();
  await callRegistration("acknowledgeProductRegistration", {
    registrationId: id,
  });
  forgetRegistration(uid, id);
}
