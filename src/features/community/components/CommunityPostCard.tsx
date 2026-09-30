import Link from "next/link";

import type { CommunityPostDocument } from "@/features/community/types/communityDocument";
import { formatCommunityDate } from "@/features/community/utils/formatCommunityDate";
type CommunityPostCardProps = { post: CommunityPostDocument };
export default function CommunityPostCard({ post }: CommunityPostCardProps) {
  return (
    <article className="border-black-200 border-b py-4">
      <Link href={`/community/${post.id}`} className="block min-w-0">
        <h2 className="text-label-16 text-black-900 truncate">{post.title}</h2>
        <p className="text-body-14 text-black-700 mt-1 truncate">
          {post.content}
        </p>
        <p className="text-caption-12 text-black-500 mt-2">
          <time dateTime={post.createdAt}>
            {formatCommunityDate(post.createdAt)}
          </time>
        </p>
      </Link>
    </article>
  );
}
