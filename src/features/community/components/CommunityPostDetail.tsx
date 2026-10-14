"use client";
import { useState } from "react";
import Image from "next/image";

import Button from "@/components/common/button/Button";
import CommunityDeletionRecovery from "@/features/community/components/CommunityDeletionRecovery";
import CommunityPostEngagement from "@/features/community/components/CommunityPostEngagement";
import DeleteCommunityPostDialog from "@/features/community/components/DeleteCommunityPostDialog";
import EditCommunityPostForm from "@/features/community/components/EditCommunityPostForm";
import { useCommunityAuthorId } from "@/features/community/hooks/useCommunityAuthorId";
import { useCommunityPostQuery } from "@/features/community/hooks/useCommunityPostQuery";
import type { CommunityPostDocument } from "@/features/community/types/communityDocument";
import { formatCommunityDate } from "@/features/community/utils/formatCommunityDate";
import { getCommunityImageUrl } from "@/features/community/utils/getCommunityImageUrl";
type CommunityPostDetailProps = { postId: string };
export default function CommunityPostDetail({
  postId,
}: CommunityPostDetailProps) {
  const postQuery = useCommunityPostQuery(postId);
  const userId = useCommunityAuthorId();
  const [editingPost, setEditingPost] = useState<CommunityPostDocument | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState("");
  if (postQuery.isPending)
    return (
      <p role="status" className="text-body-16 text-black-900">
        {postQuery.isPaused
          ? "인터넷 연결을 확인해주세요."
          : "게시글을 불러오고 있습니다."}
      </p>
    );
  if (postQuery.isError && !postQuery.data)
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
      <div>
        <p role="status" className="text-body-16 text-black-900">
          존재하지 않거나 삭제된 게시글입니다.
        </p>
        {userId && (
          <CommunityDeletionRecovery
            key={userId}
            postId={postId}
            userId={userId}
          />
        )}
      </div>
    );
  if (editingPost && editingPost.authorId === userId)
    return (
      <EditCommunityPostForm
        post={editingPost}
        onCancel={() => setEditingPost(null)}
        onSaved={(isCleaned) => {
          setEditingPost(null);
          setNotice(
            isCleaned
              ? "게시글을 수정했습니다."
              : "게시글은 수정했지만 제거한 사진 파일 일부를 정리하지 못했습니다.",
          );
        }}
      />
    );
  return (
    <article>
      {notice && (
        <p role="status" className="text-body-14 text-black-900 mb-4">
          {notice}
        </p>
      )}
      {userId === post.authorId && (
        <div className="mb-4 flex justify-end gap-3">
          <Button
            onClick={() => {
              setNotice("");
              setEditingPost(post);
            }}
          >
            수정
          </Button>
          <Button onClick={() => setIsDeleting(true)}>삭제</Button>
        </div>
      )}
      {isDeleting && userId === post.authorId && (
        <DeleteCommunityPostDialog
          postId={postId}
          userId={userId}
          onClose={() => setIsDeleting(false)}
        />
      )}
      <header className="border-black-200 border-b pb-6">
        <h1 className="text-heading-24 text-black-900 break-words">
          {post.title}
        </h1>
        <p className="text-caption-12 text-black-500 mt-3">
          <time dateTime={post.createdAt}>
            {formatCommunityDate(post.createdAt)}
          </time>
          {post.createdAt !== post.updatedAt && " (수정됨)"}
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
      <CommunityPostEngagement post={post} />
    </article>
  );
}
