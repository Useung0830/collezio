export type UserPost = {
  id: number;
  title: string;
  summary: string;
  createdAt: string;
  viewCount: number;
};

export type UserComment = {
  id: number;
  postId: number;
  postTitle: string;
  content: string;
  createdAt: string;
};

export type UserContentTab = "posts" | "comments";
