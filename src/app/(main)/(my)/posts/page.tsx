import type { Metadata } from "next";

import UserContentHistory from "@/features/community/components/UserContentHistory";
import ProfileSummary from "@/features/user/components/ProfileSummary";

export const metadata: Metadata = {
  title: "내가 쓴 글",
  description: "커뮤니티에 내가 작성한 게시글과 댓글을 확인해보세요.",
};

export default function PostsPage() {
  return (
    <div className="flex w-full flex-col gap-7">
      <ProfileSummary />
      <UserContentHistory />
    </div>
  );
}
