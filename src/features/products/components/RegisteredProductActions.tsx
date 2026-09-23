import Button from "@/components/common/button/Button";
import ToggleButton from "@/components/common/button/ToggleButton";
import type { ProductTransaction } from "@/features/products/types/product";

import HeartOutlineIcon from "@/assets/icons/icon-heart-outline.svg";

interface RegisteredProductActionsProps {
  transactionType: ProductTransaction["type"];
  favoriteCount: number;
  chatCount: number;
}

export default function RegisteredProductActions({
  transactionType,
  favoriteCount,
  chatCount,
}: RegisteredProductActionsProps) {
  const isSale = transactionType === "sale";

  return (
    <>
      <div className="text-black-400 text-label-14 flex gap-1">
        <span>찜 {favoriteCount}</span>
        <span aria-hidden="true">·</span>
        <span>채팅 {chatCount}</span>
      </div>
      <div className="text-label-16 flex justify-between gap-4">
        <ToggleButton
          isPressed={false}
          size="lg"
          shape="rounded"
          disabled
          title="준비 중"
          aria-label="찜 (준비 중)"
        >
          <HeartOutlineIcon className="size-4.5" aria-hidden="true" />
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
    </>
  );
}
