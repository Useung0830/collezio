import type { Metadata } from "next";

import NewCommunityPostForm from "@/features/community/components/NewCommunityPostForm";

export const metadata: Metadata = {
  title: "게시글 작성",
  description: "나의 컬렉션 이야기와 수집 정보를 커뮤니티에 공유해보세요.",
};

export default function NewCommunityPostPage() {
  return <NewCommunityPostForm />;
}
