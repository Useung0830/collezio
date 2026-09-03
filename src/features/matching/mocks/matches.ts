import type { MatchProposal } from "@/features/matching/types/match";

import productImage from "@/assets/images/product-luffy-figure.jpg";
import profileImage from "@/assets/images/profile.png";

const baseProposal = {
  title: "원피스 조로 피규어",
  description:
    "미개봉 상품입니다! 상태 좋아요.\n교환 가능하시면 편하게 연락 주세요 :)",
  location: "서울 마포구",
  createdAt: "10분 전",
  ownerName: "컬렉션 모아모아",
  tradeCount: 12,
  rating: 4.9,
  ownerImage: profileImage,
  ownedProductImage: productImage,
  proposedProductImage: productImage,
};

export const matchProposals: MatchProposal[] = [
  { id: 1, type: "received", status: "제안 중", ...baseProposal },
  { id: 2, type: "sent", status: "제안 중", ...baseProposal },
  { id: 3, type: "recommended", ...baseProposal },
];
