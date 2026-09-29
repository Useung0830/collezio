"use client";

import { useState } from "react";

import Button from "@/components/common/button/Button";
import LinkButton from "@/components/common/button/LinkButton";
import ToggleButton from "@/components/common/button/ToggleButton";
import { useProductFavoriteQuery } from "@/features/favorite/hooks/useProductFavoriteQuery";
import { useUpdateProductFavoriteMutation } from "@/features/favorite/hooks/useUpdateProductFavoriteMutation";
import type { ProductTransaction } from "@/features/products/types/product";

import HeartIcon from "@/assets/icons/icon-heart.svg";
import HeartOutlineIcon from "@/assets/icons/icon-heart-outline.svg";

interface RegisteredProductActionsProps {
  productId: string;
  transactionType: ProductTransaction["type"];
  favoriteCount: number;
  chatCount: number;
}

export default function RegisteredProductActions({
  productId,
  transactionType,
  favoriteCount,
  chatCount,
}: RegisteredProductActionsProps) {
  const favoriteQuery = useProductFavoriteQuery(productId);
  const favoriteMutation = useUpdateProductFavoriteMutation();
  const [isLoginRequired, setIsLoginRequired] = useState(false);
  const isSale = transactionType === "sale";
  const isFavorite = favoriteQuery.isLoggedIn && favoriteQuery.data === true;
  const isDisabled =
    favoriteQuery.isAuthLoading ||
    favoriteMutation.isPending ||
    (favoriteQuery.isLoggedIn &&
      (!favoriteQuery.isSuccess || favoriteQuery.isFetching));

  const handleToggleFavorite = () => {
    if (isDisabled) return;
    if (!favoriteQuery.userId) {
      setIsLoginRequired(true);
      return;
    }
    favoriteMutation.mutate({
      productId,
      userId: favoriteQuery.userId,
      isFavorite: !isFavorite,
    });
  };

  return (
    <>
      <div className="text-black-400 text-label-14 flex gap-1">
        <span aria-live="polite">찜 {favoriteCount}</span>
        <span aria-hidden="true">·</span>
        <span>채팅 {chatCount}</span>
      </div>
      <div className="text-label-16 flex justify-between gap-4">
        <ToggleButton
          isPressed={isFavorite}
          size="lg"
          shape="rounded"
          disabled={isDisabled}
          isLoading={favoriteMutation.isPending}
          onClick={handleToggleFavorite}
          aria-label="찜"
        >
          {isFavorite ? (
            <HeartIcon className="size-4.5" aria-hidden="true" />
          ) : (
            <HeartOutlineIcon className="size-4.5" aria-hidden="true" />
          )}
          <span className="whitespace-nowrap">찜</span>
        </ToggleButton>
        <Button
          variant={isSale ? "blue" : "green"}
          size="lg"
          shape="rounded"
          className="min-w-0 flex-1 whitespace-nowrap"
          disabled
          title="준비 중"
          aria-label={`${isSale ? "판매하기" : "교환하기"} (준비 중)`}
        >
          {isSale ? "판매하기" : "교환하기"}
        </Button>
      </div>
      {isLoginRequired && !favoriteQuery.isLoggedIn && (
        <div className="text-body-16 text-black-900 flex flex-wrap items-center gap-3">
          <p role="status">로그인 후 상품을 찜할 수 있습니다.</p>
          <LinkButton href="/login" size="sm">
            로그인
          </LinkButton>
        </div>
      )}
      {favoriteQuery.isLoggedIn && favoriteQuery.isPending && (
        <p role="status" className="text-body-16 text-black-900">
          {favoriteQuery.isPaused
            ? "인터넷 연결을 확인해주세요."
            : "찜 상태를 확인하고 있습니다."}
        </p>
      )}
      {favoriteQuery.isLoggedIn && favoriteQuery.isError && (
        <div className="text-body-16 text-black-900 flex flex-wrap items-center gap-3">
          <p role="alert">찜 상태를 불러오지 못했습니다.</p>
          <Button
            size="sm"
            disabled={favoriteQuery.isFetching}
            onClick={() => void favoriteQuery.refetch()}
          >
            찜 상태 다시 확인
          </Button>
        </div>
      )}
      {favoriteMutation.isError && (
        <p role="alert" className="text-body-16 text-black-900">
          찜 변경에 실패했습니다. 연결 상태를 확인한 뒤 다시 시도해주세요.
        </p>
      )}
      {favoriteMutation.isPaused && (
        <p role="status" className="text-body-16 text-black-900">
          인터넷 연결을 기다리고 있습니다.
        </p>
      )}
    </>
  );
}
