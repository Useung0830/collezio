import type { Metadata } from "next";
import Link from "next/link";

import CommunityPostDetail from "@/features/community/components/CommunityPostDetail";

import RightIcon from "@/assets/icons/icon-right.svg";

export const metadata: Metadata = {
  title: "커뮤니티 게시글",
  description: "수집가의 이야기를 읽고 댓글과 좋아요로 소통해보세요.",
};

export default async function CommunityPostPage(
  props: PageProps<"/community/[postId]">,
) {
  const { postId } = await props.params;

  return (
    <div className="mx-auto w-full max-w-184 pb-20">
      <Link
        href="/community"
        className="text-label-16 text-black-900 inline-flex items-center gap-1"
      >
        <RightIcon className="size-5 rotate-180" aria-hidden="true" />
        게시글 목록
      </Link>

      <div className="mt-8">
        <CommunityPostDetail postId={postId} />
      </div>
    </div>
  );
}
