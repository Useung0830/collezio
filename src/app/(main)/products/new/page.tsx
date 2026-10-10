import type { Metadata } from "next";

import NewProductForm from "@/features/products/components/NewProductForm";

export const metadata: Metadata = {
  title: "상품 등록",
  description: "소장품의 사진과 정보를 등록하고 교환할 컬렉션을 소개해보세요.",
};

export default function NewProductPage() {
  return <NewProductForm />;
}
