import Image from "next/image";

import type {
  CommunityComment,
  CommunityPost,
} from "@/features/community/types/communityPost";

import CommunityPostEngagement from "./CommunityPostEngagement";

type CommunityPostDetailProps = {
  comments: CommunityComment[];
  post: CommunityPost;
};

export default function CommunityPostDetail({
  comments,
  post,
}: CommunityPostDetailProps) {
  const images = post.images ?? [];

  return (
    <article>
      <header className="border-black-200 border-b pb-6">
        <h1 className="text-heading-24 text-black-900">{post.title}</h1>
        <p className="text-caption-12 text-black-500 mt-3">
          {post.createdAt}
          <span className="mx-2">·</span>
          조회 {post.viewCount.toLocaleString("ko-KR")}
        </p>
      </header>

      <div className="min-h-60 py-8">
        {images.length > 0 && (
          <div className="grid grid-cols-1 gap-4 lg:max-w-120">
            {images.map((image, index) => (
              <Image
                key={`${image.src}-${index}`}
                src={image}
                alt={`${post.title} 게시물 이미지 ${index + 1}`}
                sizes="(min-width: 1024px) 480px, 100vw"
                className="h-auto w-full rounded-2xl"
              />
            ))}
          </div>
        )}
        <p
          className={`text-body-16-relaxed text-black-900 whitespace-pre-line ${images.length > 0 ? "mt-6" : ""}`}
        >
          {post.content}
        </p>
      </div>

      <CommunityPostEngagement
        initialComments={comments}
        initialLikeCount={post.likeCount}
        postId={post.id}
      />
    </article>
  );
}
