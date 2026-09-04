import Link from "next/link";
import { notFound } from "next/navigation";

import CommunityPostDetail from "@/features/community/components/CommunityPostDetail";
import { communityComments } from "@/features/community/mocks/communityComments";
import { communityPosts } from "@/features/community/mocks/communityPosts";

import RightIcon from "@/assets/icons/icon-right.svg";

export function generateStaticParams() {
  return communityPosts.map((post) => ({ postId: String(post.id) }));
}

export default async function CommunityPostPage(
  props: PageProps<"/community/[postId]">,
) {
  const { postId } = await props.params;
  const id = Number(postId);
  const post = communityPosts.find((item) => item.id === id);

  if (!post) {
    notFound();
  }

  const comments = communityComments.filter((comment) => comment.postId === id);

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
        <CommunityPostDetail post={post} comments={comments} />
      </div>
    </div>
  );
}
