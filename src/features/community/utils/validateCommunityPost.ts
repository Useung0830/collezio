import type { CreateCommunityPostInput } from "@/features/community/types/communityDocument";

export function validateCommunityPost(input: CreateCommunityPostInput) {
  const title = input.title.trim();
  const content = input.content.trim();
  if (!title || title.length > 100) {
    throw new Error("제목은 1~100자로 입력해주세요.");
  }
  if (!content || content.length > 5000) {
    throw new Error("본문은 1~5,000자로 입력해주세요.");
  }
  return { title, content };
}
