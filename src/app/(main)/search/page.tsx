import type { Metadata } from "next";

import SearchProductResults from "@/features/products/components/SearchProductResults";
import { isProductCategory } from "@/features/products/constants/productCategories";

export const metadata: Metadata = {
  title: "상품 검색",
  description: "제목과 카테고리로 콜레지오 상품을 찾아보세요.",
};

type SearchPageProps = {
  searchParams: Promise<{
    query?: string | string[];
    category?: string | string[];
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const searchText =
    typeof params.query === "string" ? params.query.trim() : "";
  const category =
    typeof params.category === "string" && isProductCategory(params.category)
      ? params.category
      : null;

  return <SearchProductResults category={category} searchText={searchText} />;
}
