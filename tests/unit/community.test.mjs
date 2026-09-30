import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

import { Timestamp } from "firebase/firestore";

import { parseCommunityComment } from "../../src/features/community/utils/parseCommunityComment.ts";
import { validateCommunityPost } from "../../src/features/community/utils/validateCommunityPost.ts";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "./parseCommunityImages")
      return nextResolve(
        new URL(
          "../../src/features/community/utils/parseCommunityImages.ts",
          import.meta.url,
        ).href,
        context,
      );
    return nextResolve(specifier, context);
  },
});
const { parseCommunityPost } =
  await import("../../src/features/community/utils/parseCommunityPost.ts");

test("게시글 입력은 공백을 정리하고 제목·본문 길이를 제한한다", () => {
  assert.deepEqual(
    validateCommunityPost({ title: " 제목 ", content: " 본문\n내용 " }),
    { title: "제목", content: "본문\n내용" },
  );
  for (const input of [
    { title: " ", content: "본문" },
    { title: "가".repeat(101), content: "본문" },
    { title: "제목", content: "\n" },
    { title: "제목", content: "가".repeat(5001) },
  ]) {
    assert.throws(() => validateCommunityPost(input));
  }
  assert.equal(
    validateCommunityPost({
      title: "가".repeat(100),
      content: "가".repeat(5000),
    }).content.length,
    5000,
  );
});

test("Firestore 데이터는 검증 후 문자열 ID와 ISO 시간으로 변환한다", () => {
  const data = {
    authorId: "user",
    title: "제목",
    content: "본문",
    images: [],
    likeCount: 0,
    viewCount: 0,
    createdAt: Timestamp.fromMillis(0),
    updatedAt: Timestamp.fromMillis(1000),
  };
  const post = parseCommunityPost("document-id", data);
  assert.equal(post.id, "document-id");
  assert.equal(post.createdAt, "1970-01-01T00:00:00.000Z");
  assert.equal(post.updatedAt, "1970-01-01T00:00:01.000Z");
  assert.notEqual(
    parseCommunityPost("id", { ...data, updatedAt: new Timestamp(1, 1) })
      .version,
    parseCommunityPost("id", { ...data, updatedAt: new Timestamp(1, 2) })
      .version,
  );
  for (const invalid of [
    null,
    [],
    {},
    { ...data, createdAt: "어제" },
    { ...data, likeCount: -1 },
    { ...data, viewCount: 0.5 },
    { ...data, authorId: "" },
    { ...data, title: " " },
  ]) {
    assert.throws(() => parseCommunityPost("id", invalid));
  }
  assert.deepEqual(
    parseCommunityPost("id", { ...data, images: ["invalid"] }).images,
    [],
  );
});

test("댓글 원문과 작성자를 검증하고 수정 충돌 검사용 나노초 버전을 보존한다", () => {
  const data = {
    authorId: "author",
    postId: "post",
    content: "댓글",
    createdAt: new Timestamp(1, 0),
    updatedAt: new Timestamp(1, 1),
  };
  const comment = parseCommunityComment("id", data);
  assert.equal(comment.version, "1:1");
  assert.equal(comment.content, "댓글");
  for (const invalid of [
    null,
    {},
    { ...data, authorId: "" },
    { ...data, postId: "post/path" },
    { ...data, content: " " },
    { ...data, content: "가".repeat(1001) },
    { ...data, createdAt: "yesterday" },
  ])
    assert.throws(() => parseCommunityComment("id", invalid));
});
