export const PRODUCT_CATEGORIES = [
  { value: "figure", label: "피규어" },
  { value: "model-kit", label: "프라모델" },
  { value: "plush", label: "인형" },
  { value: "card", label: "카드" },
  { value: "other", label: "기타" },
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]["value"];

export function isProductCategory(value: string): value is ProductCategory {
  return PRODUCT_CATEGORIES.some((category) => category.value === value);
}

export function getProductCategoryLabel(category: ProductCategory): string {
  return (
    PRODUCT_CATEGORIES.find((item) => item.value === category)?.label ?? "기타"
  );
}
