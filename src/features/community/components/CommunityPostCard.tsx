import Image from "next/image";
import Link from "next/link";

import type { CommunityPostDocument } from "@/features/community/types/communityDocument";
import { formatCommunityDate } from "@/features/community/utils/formatCommunityDate";
import { getCommunityImageUrl } from "@/features/community/utils/getCommunityImageUrl";
type CommunityPostCardProps = { post: CommunityPostDocument };
export default function CommunityPostCard({ post }: CommunityPostCardProps) {
  const thumbnail = post.images[0];
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
            <time dateTime={post.createdAt}>
              {formatCommunityDate(post.createdAt)}
            </time>
          </p>
        </div>
        {thumbnail && (
          <Image
            src={getCommunityImageUrl(thumbnail.url)}
            alt={`${post.title} 썸네일`}
            width={80}
            height={80}
            unoptimized={
              process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true"
            }
            className="size-20 shrink-0 rounded-xl object-cover"
          />
        )}
      </Link>
    </article>
  );
}
