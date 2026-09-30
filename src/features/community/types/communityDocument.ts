export type CommunityImage = {
  url: string;
  path: string;
};

export type CommunityPostDocument = {
  id: string;
  authorId: string;
  title: string;
  content: string;
  images: CommunityImage[];
  createdAt: string;
  updatedAt: string;
  version: string;
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
  files?: File[];
};
