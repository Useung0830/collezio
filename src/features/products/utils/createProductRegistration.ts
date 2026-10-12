import type {
  CreateProductInput,
  ProductImage,
} from "@/features/products/types/product";

import { ProductRegistrationError } from "./productRegistrationError";

export type RegisterProductInput = Omit<CreateProductInput, "images"> & {
  files: File[];
};

type RegistrationServices = {
  getUserId: () => Promise<string>;
  createId: () => string;
  uploadImage: (file: File) => Promise<ProductImage>;
  deleteImages: (paths: string[], userId: string) => Promise<string[]>;
  saveProduct: (
    input: CreateProductInput,
    userId: string,
    productId: string,
  ) => Promise<string>;
  isDefiniteFailure: (error: unknown) => boolean;
};

type PendingSave = {
  input: CreateProductInput;
  userId: string;
  productId: string;
};

export function createProductRegistration(services: RegistrationServices) {
  let pendingSave: PendingSave | null = null;
  let pendingCleanup: { paths: string[]; userId: string } | null = null;
  let isRunning = false;

  const cleanImages = async () => {
    if (!pendingCleanup) return;
    const { paths, userId } = pendingCleanup;
    // Retain the list if cleanup itself rejects, so a later retry can finish it.
    const remaining = await services.deleteImages(paths, userId);
    pendingCleanup = remaining.length ? { paths: remaining, userId } : null;
    if (pendingCleanup) {
      throw new ProductRegistrationError(
        "사진 정리를 완료하지 못했습니다. 같은 계정으로 연결을 확인한 뒤 다시 시도해주세요.",
      );
    }
  };

  return async (input: RegisterProductInput) => {
    if (isRunning) throw new Error("상품을 등록 중입니다.");
    isRunning = true;
    try {
      if (pendingSave) {
        // Retry the original document before accepting edited fields or uploading again.
        try {
          const userId = await services.getUserId();
          if (pendingSave.userId !== userId) throw new Error("계정 변경");
          const id = await services.saveProduct(
            pendingSave.input,
            userId,
            pendingSave.productId,
          );
          pendingSave = null;
          return id;
        } catch {
          throw new ProductRegistrationError(
            "이전 등록 결과를 확인하지 못했습니다. 같은 계정으로 연결을 복구한 뒤 등록 확인을 눌러주세요.",
            true,
          );
        }
      }
      const userId = await services.getUserId();
      await cleanImages();
      const { files, ...product } = input;
      if (files.length === 0 || files.length > 10)
        throw new Error("사진은 1장 이상, 10장 이하로 등록해주세요.");
      for (const file of files) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
          throw new Error("JPG, PNG, WebP 사진만 등록할 수 있습니다.");
        if (file.size === 0 || file.size > 5 * 1024 * 1024)
          throw new Error("사진은 빈 파일이 아닌 5MB 이하 파일이어야 합니다.");
      }

      const images: ProductImage[] = [];
      let hasAttemptedSave = false;
      const productId = services.createId();
      try {
        for (const file of files) {
          if ((await services.getUserId()) !== userId)
            throw new Error("로그인 상태가 변경되었습니다.");
          images.push(await services.uploadImage(file));
        }
        if ((await services.getUserId()) !== userId)
          throw new Error("로그인 상태가 변경되었습니다.");
        const productInput = { ...product, images };
        pendingSave = { input: productInput, userId, productId };
        hasAttemptedSave = true;
        const id = await services.saveProduct(productInput, userId, productId);
        pendingSave = null;
        return id;
      } catch (error) {
        if (hasAttemptedSave && !services.isDefiniteFailure(error)) {
          throw new ProductRegistrationError(
            "등록 결과를 확인하지 못했습니다. 입력 내용과 사진을 보관하고 있습니다. 연결을 복구한 뒤 등록 확인을 눌러주세요.",
            true,
          );
        }
        pendingSave = null;
        pendingCleanup = { paths: images.map((image) => image.path), userId };
        await cleanImages();
        throw error;
      }
    } finally {
      isRunning = false;
    }
  };
}
