export const communityQueryKeys = {
  all: ["community"],
  posts: ["community", "posts"],
  detail: (postId: string) => ["community", "post", postId],
  deletion: (postId: string, userId: string) => [
    "community",
    "deletion",
    postId,
    userId,
  ],
  comments: (postId: string) => ["community", "comments", postId],
  like: (postId: string, userId: string | null | undefined) => [
    "community",
    "like",
    postId,
    userId,
  ],
  myPosts: (userId: string | null | undefined) => [
    "community",
    "myPosts",
    userId,
  ],
  myComments: (userId: string | null | undefined) => [
    "community",
    "myComments",
    userId,
  ],
};
