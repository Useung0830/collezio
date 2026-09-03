import Image from "next/image";
import Link from "next/link";

import type { SingleProductCompletedTrade } from "@/features/review/types/review";

type SingleTradeProductImageProps = {
  trade: SingleProductCompletedTrade;
};

export default function SingleTradeProductImage({
  trade,
}: SingleTradeProductImageProps) {
  return (
    <Link
      href={`/products/${trade.product.id}`}
      className="bg-black-100 relative size-30 shrink-0 self-center overflow-hidden rounded-2xl md:self-auto"
    >
      <Image
        src={trade.product.image}
        alt={trade.product.title}
        fill
        sizes="120px"
        className="object-cover"
      />
    </Link>
  );
}
