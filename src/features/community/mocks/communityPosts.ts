import type { CommunityPost } from "@/features/community/types/communityPost";

import productImage from "@/assets/images/product-luffy-figure.jpg";

export const communityPosts: CommunityPost[] = [
  {
    id: 1,
    title: "조로 피규어 드디어 구했습니다!",
    content:
      "몇 달 동안 찾던 조로 피규어를 이번에 교환으로 구했습니다.\n\n사진으로 볼 때도 마음에 들었는데 실제로 받아보니 도색과 디테일이 훨씬 예쁘네요. 좋은 교환을 하게 되어 기쁩니다!",
    createdAt: "2주 전",
    viewCount: 1229,
    likeCount: 10,
    images: [productImage, productImage, productImage],
  },
  {
    id: 2,
    title: "피규어 박스도 다들 보관하시나요?",
    content:
      "피규어가 하나둘 늘어나면서 박스 보관 공간이 부족해졌습니다.\n\n박스를 버리면 나중에 교환하거나 판매할 때 가치에 영향이 큰지 궁금해요. 다들 박스는 어떻게 보관하시나요?",
    createdAt: "2주 전",
    viewCount: 856,
    likeCount: 6,
  },
  {
    id: 3,
    title: "직거래할 때 상품 상태 어디까지 확인하세요?",
    content:
      "이번에 처음으로 직거래를 하게 됐습니다. 미개봉 제품이라 현장에서 박스를 열어 확인하기는 애매할 것 같은데, 보통 어느 부분까지 확인하시는지 궁금합니다.",
    createdAt: "3주 전",
    viewCount: 940,
    likeCount: 9,
  },
  {
    id: 4,
    title: "한정판 피규어 보관 방법 공유합니다",
    content:
      "한정판 제품은 직사광선이 닿지 않는 장식장에 보관하고 있습니다. 작은 제습제를 함께 넣고 주기적으로 환기해주니 박스와 제품 상태가 잘 유지되는 것 같아요.",
    createdAt: "3주 전",
    viewCount: 731,
    likeCount: 14,
    images: [productImage],
  },
  {
    id: 5,
    title: "택배 교환할 때 포장 팁이 있을까요?",
    content:
      "처음으로 택배 교환을 진행하게 됐습니다. 에어캡은 준비했는데 박스 안의 빈 공간을 어떻게 채우면 좋을지 고민이에요. 안전하게 포장하는 팁이 있다면 알려주세요.",
    createdAt: "1개월 전",
    viewCount: 615,
    likeCount: 4,
  },
  {
    id: 6,
    title: "이 피규어 시세 어느 정도일까요?",
    content:
      "예전에 선물받아 보관하던 피규어입니다. 비슷한 제품을 검색해도 가격 차이가 커서 적정 시세를 판단하기 어렵네요. 제품 상태는 좋은 편인데 어느 정도가 적당할까요?",
    createdAt: "1개월 전",
    viewCount: 1229,
    likeCount: 10,
  },
];
