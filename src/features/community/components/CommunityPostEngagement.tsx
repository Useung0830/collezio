"use client";

import CommunityComments from "@/features/community/components/CommunityComments";
import CommunityLikeButton from "@/features/community/components/CommunityLikeButton";
import { useCommunityAuthorId } from "@/features/community/hooks/useCommunityAuthorId";
import type { CommunityPostDocument } from "@/features/community/types/communityDocument";

type CommunityPostEngagementProps = { post: CommunityPostDocument };

export default function CommunityPostEngagement({
  post,
}: CommunityPostEngagementProps) {
  const userId = useCommunityAuthorId();
  return (
    <div key={userId ?? "guest"}>
      <CommunityLikeButton post={post} userId={userId} />
      <CommunityComments postId={post.id} userId={userId} />
    </div>
  );
}
