"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { getMyProducts } from "@/features/products/api/getMyProducts";

interface TradeProductPickerProps {
  userId: string;
  selected: string | null;
  reservedProductId?: string | null;
  onSelect: (id: string) => void;
}

export default function TradeProductPicker({
  userId,
  selected,
  reservedProductId,
  onSelect,
}: TradeProductPickerProps) {
  const query = useQuery({
    queryKey: ["products", "trade-selection", userId],
    queryFn: () => getMyProducts(userId),
    staleTime: 0,
  });
  const products = query.data?.filter(
    (product) =>
      product.status === "available" ||
      (product.id === reservedProductId && product.status === "reserved"),
  );
  return (
    <section aria-label="교환할 내 상품">
      <div className="flex items-center justify-between gap-3">
        <p>교환할 내 상품 (1개)</p>
        <Link
          href="/products/new"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-blue underline"
        >
          상품 등록하기
        </Link>
      </div>
      <p className="text-caption-12 mt-1">
        상품 등록은 새 창에서 열립니다. 돌아온 뒤 새로고침을 눌러주세요.
      </p>
      <button
        type="button"
        onClick={() => void query.refetch()}
        disabled={query.isFetching}
        className="my-2 underline"
      >
        상품 목록 새로고침
      </button>
      {query.isPending ? (
        <p role="status">내 상품을 불러오고 있습니다.</p>
      ) : query.isError ? (
        <p role="alert">상품을 불러오지 못했습니다. 다시 새로고침해주세요.</p>
      ) : (
        <div className="max-h-60 space-y-2 overflow-y-auto">
          {!products?.length && <p>교환 가능한 등록 상품이 없습니다.</p>}
          {products?.map((product) => (
            <label
              key={product.id}
              className={`border-black-200 flex cursor-pointer items-center gap-3 rounded-lg border p-2 ${selected === product.id ? "bg-black-50" : ""}`}
            >
              <input
                type="radio"
                name="exchangeProduct"
                checked={selected === product.id}
                onChange={() => onSelect(product.id)}
              />
              {product.image && (
                <Image
                  src={product.image}
                  alt={product.title}
                  width={48}
                  height={48}
                  className="size-12 rounded object-cover"
                />
              )}
              <span className="min-w-0">
                <span className="block truncate">{product.title}</span>
                <span className="text-caption-12">
                  {product.status === "available"
                    ? "거래 가능"
                    : "현재 약속 상품"}
                </span>
              </span>
            </label>
          ))}
        </div>
      )}
    </section>
  );
}
