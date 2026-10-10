import type { Metadata } from "next";
import Link from "next/link";

import { getCommunityPostMetadata } from "@/features/community/api/getCommunityPostMetadata";
import CommunityPostDetail from "@/features/community/components/CommunityPostDetail";

import { createShareMetadata } from "@/lib/createShareMetadata";

import RightIcon from "@/assets/icons/icon-right.svg";

const fallbackMetadata = {
  title: "커뮤니티 게시글",
  description: "수집가의 이야기를 읽고 댓글과 좋아요로 소통해보세요.",
};

export async function generateMetadata(
  props: PageProps<"/community/[postId]">,
): Promise<Metadata> {
  const { postId } = await props.params;
  const shareOptions = {
    ...fallbackMetadata,
    path: `/community/${encodeURIComponent(postId)}`,
    type: "article" as const,
  };
  try {
    const post = await getCommunityPostMetadata(postId);
    if (!post) return createShareMetadata({ ...shareOptions, noindex: true });
    return createShareMetadata({
      ...shareOptions,
      title: post.title,
      description: post.description || fallbackMetadata.description,
      imageUrl: post.imageUrl,
    });
  } catch {
    // 메타데이터 조회 장애가 기존 상세 화면까지 막지 않도록 기본 문구를 사용합니다.
    return createShareMetadata(shareOptions);
  }
}

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
