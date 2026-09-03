import { productDetails } from "@/features/products/mocks/products";
import type { CompletedTrade, ReviewTag } from "@/features/review/types/review";

import profileImage from "@/assets/images/profile.png";

export const reviewTags: ReviewTag[] = [
  { id: 1, label: "친절해요", count: 18 },
  { id: 2, label: "설명과 같아요", count: 18 },
  { id: 3, label: "상품 상태가 좋아요", count: 15 },
  { id: 4, label: "거래가 빨랐어요", count: 15 },
  { id: 5, label: "응답이 빨라요", count: 13 },
  { id: 6, label: "포장이 꼼꼼해요", count: 13 },
  { id: 7, label: "약속을 잘 지켜요", count: 11 },
  { id: 8, label: "다시 거래하고 싶어요", count: 11 },
];

export const completedTrades: CompletedTrade[] = [
  {
    id: 1,
    type: "exchange",
    completedAt: "10분 전",
    partnerName: "조로수집가",
    partnerImage: profileImage,
    partnerTradeCount: 12,
    partnerRating: 4.9,
    ownedProduct: {
      id: productDetails[0].id,
      title: productDetails[0].title,
      image: productDetails[0].image,
    },
    receivedProduct: {
      id: productDetails[1].id,
      title: productDetails[1].title,
      image: productDetails[1].image,
    },
  },
  {
    id: 2,
    type: "purchase",
    completedAt: "3일 전",
    partnerName: "피규어마켓",
    partnerImage: profileImage,
    partnerTradeCount: 31,
    partnerRating: 4.8,
    product: {
      id: productDetails[2].id,
      title: productDetails[2].title,
      image: productDetails[2].image,
    },
    price: 32000,
    tradeMethod: "parcel",
  },
  {
    id: 3,
    type: "sale",
    completedAt: "1주 전",
    partnerName: "굿즈모아",
    partnerImage: profileImage,
    partnerTradeCount: 18,
    partnerRating: 4.7,
    product: {
      id: productDetails[4].id,
      title: productDetails[4].title,
      image: productDetails[4].image,
    },
    price: 18000,
    tradeMethod: "direct",
  },
];
