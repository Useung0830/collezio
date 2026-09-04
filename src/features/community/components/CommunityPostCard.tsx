import Image from "next/image";
import Link from "next/link";

import type { CommunityPost } from "@/features/community/types/communityPost";

import ChatIcon from "@/assets/icons/icon-chat.svg";
import GoodIcon from "@/assets/icons/icon-good.svg";

type CommunityPostCardProps = {
  commentCount: number;
  post: CommunityPost;
};

export default function CommunityPostCard({
  commentCount,
  post,
}: CommunityPostCardProps) {
  const thumbnail = post.images?.[0];

  return (
    <article className="border-black-200 border-b py-4">
      <Link
        href={`/community/${post.id}`}
        className="flex min-w-0 items-center gap-4"
      >
        <div className="min-w-0 flex-1">
          <h2 className="text-label-16 text-black-900 truncate">
            {post.title}
          </h2>
          <p className="text-body-14 text-black-700 mt-1 truncate">
            {post.content}
          </p>
          <p className="text-caption-12 text-black-500 mt-2">
            {post.createdAt}
            <span className="mx-2">·</span>
            조회 {post.viewCount.toLocaleString("ko-KR")}
          </p>
          <div className="text-caption-12 text-black-500 mt-2 flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ChatIcon className="size-3.5" aria-hidden="true" />
              {commentCount}
            </span>
            <span className="flex items-center gap-1">
              <GoodIcon className="size-3.5" aria-hidden="true" />
              {post.likeCount}
            </span>
          </div>
        </div>

        {thumbnail && (
          <Image
            src={thumbnail}
            alt={`${post.title} 썸네일`}
            width={80}
            height={80}
            className="size-18 shrink-0 rounded-xl object-cover sm:size-20"
          />
        )}
      </Link>
    </article>
  );
}
