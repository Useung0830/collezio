import type { CreateProductInput, ProductImage } from "./product";
export type ProductRegistrationFile = {
  id: string;
  name: string;
  contentType: string;
  size: number;
  sha256: string;
  status: "pending" | "ready";
  image?: ProductImage;
};
export type ProductRegistration = {
  id: string;
  productId: string;
  status: "pending" | "expired" | "committed" | "cleaning" | "cleaned";
  expiresAt: number;
  product: Omit<CreateProductInput, "images"> | null;
  files: ProductRegistrationFile[];
};
export type RegisterProductInput = Omit<CreateProductInput, "images"> & {
  files: File[];
};
