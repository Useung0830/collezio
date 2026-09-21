import { createProduct } from "@/features/products/api/createProduct";
import { uploadProductImage } from "@/features/products/api/uploadProductImage";
import type {
  CreateProductInput,
  ProductImage,
} from "@/features/products/types/product";

type RegisterProductInput = Omit<CreateProductInput, "images"> & {
  files: File[];
};

export async function registerProduct({
  files,
  ...product
}: RegisterProductInput) {
  if (files.length === 0 || files.length > 10) {
    throw new Error("사진은 1장 이상, 10장 이하로 등록해주세요.");
  }

  const images: ProductImage[] = [];

  for (const file of files) {
    const image = await uploadProductImage(file);
    images.push(image);
  }

  return createProduct({
    ...product,
    images,
  });
}
