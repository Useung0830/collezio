import Image, { type StaticImageData } from "next/image";

type TradePartnerSummaryProps = {
  image: StaticImageData | string;
  name: string;
  tradeCount: number;
  rating: number;
};

export default function TradePartnerSummary({
  image,
  name,
  tradeCount,
  rating,
}: TradePartnerSummaryProps) {
  return (
    <div className="flex items-center gap-2">
      <Image
        src={image}
        alt={`${name} 프로필`}
        width={24}
        height={24}
        className="rounded-full"
      />
      <span className="text-caption-12-bold">{name}</span>
      <span className="text-caption-12 text-black-600">
        · 거래 {tradeCount}회 · 평점 {rating}
      </span>
    </div>
  );
}
