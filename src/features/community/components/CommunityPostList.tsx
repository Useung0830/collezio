import CommunityPostCard from "@/features/community/components/CommunityPostCard";
import { communityComments } from "@/features/community/mocks/communityComments";
import { communityPosts } from "@/features/community/mocks/communityPosts";

export default function CommunityPostList() {
  return (
    <div>
      {communityPosts.map((post) => {
        const commentCount = communityComments.filter(
          (comment) => comment.postId === post.id,
        ).length;

        return (
          <CommunityPostCard
            key={post.id}
            post={post}
            commentCount={commentCount}
          />
        );
      })}
    </div>
  );
}
