import type { CommunityComment } from "@/features/community/types/communityPost";

export const communityComments: CommunityComment[] = [
  {
    id: 1,
    postId: 1,
    author: "피규어수집가",
    content: "축하드려요! 실물 디테일이 정말 멋진 제품이죠.",
    createdAt: "2주 전",
  },
  {
    id: 2,
    postId: 1,
    author: "조로팬",
    content: "저도 찾고 있는 제품인데 좋은 교환 하셨네요!",
    createdAt: "2주 전",
  },
  {
    id: 3,
    postId: 2,
    author: "컬렉션모아",
    content: "교환할 계획이 있다면 박스도 같이 보관하는 편이 좋아요.",
    createdAt: "1주 전",
  },
];
