import "server-only";

import { productDetails } from "@/features/products/mocks/products";
import type { ProductDetail } from "@/features/products/types/product";

export async function getProductDetail(
  productId: number,
): Promise<ProductDetail | null> {
  return productDetails.find((product) => product.id === productId) ?? null;
}
