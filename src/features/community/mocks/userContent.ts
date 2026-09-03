import type {
  UserComment,
  UserPost,
} from "@/features/community/types/userContent";

export const userPosts: UserPost[] = [
  {
    id: 1,
    title: "조로 피규어 드디어 구했습니다!",
    summary:
      "몇 달 동안 찾던 제품인데 이번에 교환으로 구했어요. 생각보다 실물이 훨씬 예쁘네요.",
    createdAt: "2주 전",
    viewCount: 1229,
  },
  {
    id: 2,
    title: "피규어 박스도 다들 보관하시나요?",
    summary:
      "공간이 부족해서 박스를 버릴까 고민 중인데 나중에 교환하거나 판매할 때 영향이 클까요?",
    createdAt: "2주 전",
    viewCount: 1229,
  },
  {
    id: 3,
    title: "직거래할 때 상품 상태 어디까지 확인하세요?",
    summary:
      "미개봉 제품이면 현장에서 박스를 열어보기 애매한데 보통 어떻게 확인하시나요?",
    createdAt: "2주 전",
    viewCount: 1229,
  },
  {
    id: 4,
    title: "이 피규어 시세 어느 정도일까요?",
    summary:
      "예전에 선물받은 제품인데 찾아봐도 가격이 제각각이라 잘 모르겠네요.",
    createdAt: "2주 전",
    viewCount: 1229,
  },
];

export const userComments: UserComment[] = [
  {
    id: 1,
    postId: 5,
    postTitle: "한정판 피규어 보관 방법을 공유해주세요",
    content: "저는 직사광선을 피하고 제습제를 함께 넣어서 보관하고 있어요.",
    createdAt: "3일 전",
  },
  {
    id: 2,
    postId: 6,
    postTitle: "교환할 때 포장은 어떻게 하시나요?",
    content: "완충재를 두 겹으로 감싸고 빈 공간이 없도록 포장하는 편이에요.",
    createdAt: "1주 전",
  },
  {
    id: 3,
    postId: 7,
    postTitle: "택배 거래 시 확인하면 좋은 것들",
    content: "보내기 전에 상품 상태와 포장 과정을 사진으로 남겨두면 좋아요.",
    createdAt: "2주 전",
  },
];
