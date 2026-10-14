import { FirebaseError } from "firebase/app";

import { createProduct } from "@/features/products/api/createProduct";
import {
  acknowledgeProductRegistration,
  callRegistration,
  cancelProductRegistration,
  getPendingProductRegistration,
  registrationUserId,
  rememberRegistration,
} from "@/features/products/api/productRegistration";
import { uploadProductImage } from "@/features/products/api/uploadProductImage";
import type {
  ProductRegistration,
  RegisterProductInput,
} from "@/features/products/types/productRegistration";
import { hashProductFile } from "@/features/products/utils/hashProductFile";

export async function registerProduct({
  files,
  ...product
}: RegisterProductInput) {
  const uid = await registrationUserId();
  if (await getPendingProductRegistration())
    throw new Error("이전 등록 작업을 먼저 확인해주세요.");
  if (files.length < 1 || files.length > 10)
    throw new Error("사진은 1장 이상, 10장 이하로 등록해주세요.");
  const manifest = [];
  for (const file of files)
    manifest.push({
      id: crypto.randomUUID(),
      name: file.name,
      contentType: file.type,
      size: file.size,
      sha256: await hashProductFile(file),
    });
  if ((await registrationUserId()) !== uid)
    throw new Error("로그인 상태가 변경되었습니다.");
  const registrationId = crypto.randomUUID();
  rememberRegistration(uid, registrationId);
  try {
    await callRegistration("beginProductRegistration", {
      registrationId,
      product,
      files: manifest,
    });
    for (let index = 0; index < files.length; index++) {
      if ((await registrationUserId()) !== uid)
        throw new Error("로그인 상태가 변경되었습니다.");
      await uploadProductImage(
        files[index],
        registrationId,
        manifest[index].id,
      );
    }
    if ((await registrationUserId()) !== uid)
      throw new Error("로그인 상태가 변경되었습니다.");
    return await createProduct(registrationId);
  } catch (error) {
    if (
      error instanceof FirebaseError &&
      error.code === "functions/invalid-argument"
    ) {
      // Cancel is atomic with finalization; an ambiguous response never deletes published images.
      try {
        await cancelProductRegistration(registrationId);
      } catch {
        /* The server will retry cleanup after expiry. */
      }
      throw new Error(error.message.replace(/\s+\[\d{3}\]$/, ""));
    }
    throw error;
  }
}

export async function resumeProductRegistration(
  registration: ProductRegistration,
  files: File[],
) {
  const uid = await registrationUserId();
  const current = await callRegistration<ProductRegistration>(
    "getProductRegistration",
    { registrationId: registration.id },
  );
  if (!current) throw new Error("등록 작업을 찾을 수 없습니다.");
  if (current.status === "committed") {
    try {
      await acknowledgeProductRegistration(current.id);
    } catch {
      /* The product already exists. */
    }
    return current.productId;
  }
  if (current.status !== "pending")
    throw new Error("등록 작업이 만료되었습니다. 새로 등록해주세요.");
  const selected = new Map<string, File>();
  for (const file of files) selected.set(await hashProductFile(file), file);
  const missing = current.files.filter((file) => file.status !== "ready");
  if (missing.some((file) => !selected.has(file.sha256)))
    throw new Error("아직 업로드되지 않은 원본 사진을 다시 선택해주세요.");
  for (const file of missing) {
    if ((await registrationUserId()) !== uid)
      throw new Error("로그인 상태가 변경되었습니다.");
    const original = selected.get(file.sha256);
    if (!original) throw new Error("원본 사진을 다시 선택해주세요.");
    await uploadProductImage(original, current.id, file.id);
  }
  if ((await registrationUserId()) !== uid)
    throw new Error("로그인 상태가 변경되었습니다.");
  return createProduct(current.id);
}
