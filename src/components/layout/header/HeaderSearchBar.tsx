"use client";

import type { RefObject } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import ProductCategorySelect from "@/features/products/components/ProductCategorySelect";
import { isProductCategory } from "@/features/products/constants/productCategories";

import HeaderSearchInput from "./HeaderSearchInput";

type HeaderSearchBarProps = {
  className?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  isCompact?: boolean;
  tabIndex?: number;
};

export default function HeaderSearchBar({
  className = "",
  inputRef,
  isCompact = false,
  tabIndex,
}: HeaderSearchBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchText =
    pathname === "/search" ? (searchParams.get("query") ?? "") : "";
  const categoryParam =
    pathname === "/search" ? searchParams.get("category") : null;
  const category =
    categoryParam && isProductCategory(categoryParam) ? categoryParam : "";
  const paddingClassName = isCompact ? "px-2 py-1.5" : "px-3 py-2";

  return (
    <form
      role="search"
      action="/search"
      className={`border-black-200 text-black-900 flex rounded-full border ${paddingClassName} ${className}`}
    >
      <div className="flex w-full min-w-0 items-center gap-2">
        <ProductCategorySelect
          key={`category:${category}`}
          name="category"
          label="검색 카테고리"
          defaultValue={category}
          includeAll
          isCompact
          tabIndex={tabIndex}
        />
        <div className="border-black-200 h-6 shrink-0 border-l" />
        <HeaderSearchInput
          key={`query:${searchText}`}
          inputRef={inputRef}
          defaultValue={searchText}
          isCompact={isCompact}
          tabIndex={tabIndex}
        />
      </div>
    </form>
  );
}
