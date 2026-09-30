"use client";
import Image from "next/image";

import Button from "@/components/common/button/Button";
import { useCommunityPostQuery } from "@/features/community/hooks/useCommunityPostQuery";
import { formatCommunityDate } from "@/features/community/utils/formatCommunityDate";
import { getCommunityImageUrl } from "@/features/community/utils/getCommunityImageUrl";
type CommunityPostDetailProps = { postId: string };
export default function CommunityPostDetail({
  postId,
}: CommunityPostDetailProps) {
  const postQuery = useCommunityPostQuery(postId);
  if (postQuery.isPending)
    return (
      <p role="status" className="text-body-16 text-black-900">
        {postQuery.isPaused
          ? "인터넷 연결을 확인해주세요."
          : "게시글을 불러오고 있습니다."}
      </p>
    );
  if (postQuery.isError)
    return (
      <div className="text-black-900">
        <p role="alert" className="text-body-16 mb-3">
          게시글을 불러오지 못했습니다.
        </p>
        <Button
          disabled={postQuery.isFetching}
          onClick={() => void postQuery.refetch()}
        >
          다시 시도
        </Button>
      </div>
    );
  const post = postQuery.data;
  if (!post)
    return (
      <p role="status" className="text-body-16 text-black-900">
        존재하지 않거나 삭제된 게시글입니다.
      </p>
    );
  return (
    <article>
      <header className="border-black-200 border-b pb-6">
        <h1 className="text-heading-24 text-black-900 break-words">
          {post.title}
        </h1>
        <p className="text-caption-12 text-black-500 mt-3">
          <time dateTime={post.createdAt}>
            {formatCommunityDate(post.createdAt)}
          </time>
        </p>
      </header>
      <div className="min-h-60 py-8">
        {post.images.length > 0 && (
          <div className="mb-6 grid gap-4 lg:max-w-120">
            {post.images.map((image, index) => (
              <div key={image.path} className="relative aspect-square w-full">
                <Image
                  src={getCommunityImageUrl(image.url)}
                  alt={`${post.title} 게시물 이미지 ${index + 1}`}
                  fill
                  sizes="(min-width: 1024px) 480px, 100vw"
                  unoptimized={
                    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true"
                  }
                  className="rounded-2xl object-contain"
                />
              </div>
            ))}
          </div>
        )}
        <p className="text-body-16-relaxed text-black-900 break-words whitespace-pre-line">
          {post.content}
        </p>
      </div>
      <p className="text-body-14 text-black-600 border-black-200 border-t pt-6">
        댓글과 좋아요 기능은 준비 중입니다.
      </p>
    </article>
  );
}
