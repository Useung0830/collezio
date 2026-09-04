import type { StaticImageData } from "next/image";

export type CommunityPost = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  viewCount: number;
  likeCount: number;
  images?: StaticImageData[];
};

export type CommunityComment = {
  id: number;
  postId: number;
  author: string;
  content: string;
  createdAt: string;
};
