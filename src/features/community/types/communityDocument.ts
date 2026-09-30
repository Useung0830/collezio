export type CommunityImage = {
  url: string;
  path: string;
};

// 화면의 샘플 타입은 실제 조회 연결 단계에서 이 타입으로 교체합니다.
export type CommunityPostDocument = {
  id: string;
  authorId: string;
  title: string;
  content: string;
  images: CommunityImage[];
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  viewCount: number;
};

export type CommunityCommentDocument = {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type CommunityLikeDocument = {
  userId: string;
  createdAt: string;
};

export type CreateCommunityPostInput = {
  title: string;
  content: string;
};
