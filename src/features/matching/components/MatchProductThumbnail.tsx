import Image from "next/image";

import type { MatchProposal } from "@/features/matching/types/match";

type MatchProductThumbnailProps = {
  label: string;
  image: MatchProposal["ownedProductImage"];
  alt: string;
};

export default function MatchProductThumbnail({
  label,
  image,
  alt,
}: MatchProductThumbnailProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-caption-12">{label}</span>
      <div className="relative size-24 overflow-hidden rounded-2xl sm:size-26 md:size-30">
        <Image
          src={image}
          alt={alt}
          fill
          sizes="(min-width: 768px) 120px, (min-width: 640px) 104px, 96px"
          className="object-cover"
        />
      </div>
    </div>
  );
}
