import assert from "node:assert/strict";
import test from "node:test";

import {
  parseCodeReview,
  publishCodeReview,
} from "../../scripts/code-review/publishCodeReview.mjs";
import {
  reviewWithOllama,
  selectReviewFiles,
} from "../../scripts/code-review/reviewWithOllama.mjs";

const files = [
  { filename: "src/example.ts", patch: "@@ -2,2 +2,2 @@\n keep\n-old\n+new" },
];
const finding = {
  path: "src/example.ts",
  line: 3,
  side: "RIGHT",
  body: "[P2] 실패 시 오류 처리가 필요합니다.",
};
const serializeReview = (findings = [finding]) =>
  JSON.stringify({ complete: true, summary: "검토 완료", findings });

test("현재 diff에 있는 추가·삭제 줄에만 리뷰 댓글을 허용한다", () => {
  for (const side of ["LEFT", "RIGHT"]) {
    const result = parseCodeReview(
      serializeReview([{ ...finding, side }]),
      files,
    );
    assert.equal(result.comments[0].side, side);
  }
  for (const invalid of [
    { ...finding, path: "src/other.ts" },
    { ...finding, line: 100 },
    { ...finding, side: "OTHER" },
    { ...finding, body: "" },
  ]) {
    assert.throws(() => parseCodeReview(serializeReview([invalid]), files));
  }
});

test("미완료·빈 결과·잘못된 JSON을 리뷰 성공으로 취급하지 않는다", () => {
  for (const invalid of [
    "",
    "not json",
    "null",
    JSON.stringify({ complete: false, summary: "중단", findings: [] }),
    JSON.stringify({ complete: true, summary: "", findings: [] }),
    serializeReview(Array(31).fill(finding)),
  ]) {
    assert.throws(() => parseCodeReview(invalid, files));
  }
  assert.deepEqual(parseCodeReview(serializeReview([]), files).comments, []);
});

function createGithub({ currentSha = "abc123", reviews = [] } = {}) {
  const published = [];
  const github = {
    rest: {
      pulls: {
        get: async () => ({
          data: {
            state: "open",
            draft: false,
            head: { sha: currentSha, repo: { full_name: "owner/repo" } },
          },
        }),
        listFiles: "files",
        listReviews: "reviews",
        createReview: async (review) => published.push(review),
      },
    },
    paginate: async (method) => (method === "files" ? files : reviews),
  };
  return { github, published };
}

const request = {
  owner: "owner",
  repo: "repo",
  pullNumber: 1,
  headSha: "abc123",
  rawReview: serializeReview(),
};

test("지적을 Resolve conversation 가능한 COMMENT 리뷰로 게시한다", async () => {
  const { github, published } = createGithub();
  await publishCodeReview({ ...request, github });
  assert.equal(published.length, 1);
  assert.equal(published[0].event, "COMMENT");
  assert.equal(published[0].commit_id, request.headSha);
  assert.deepEqual(published[0].comments, [finding]);
});

test("새 커밋이 올라오면 이전 커밋의 결과 게시를 거부한다", async () => {
  const { github, published } = createGithub({ currentSha: "new-sha" });
  await assert.rejects(publishCodeReview({ ...request, github }));
  assert.equal(published.length, 0);
});

test("동일 커밋 재실행 시 봇의 완료 리뷰를 중복 게시하지 않는다", async () => {
  const { github, published } = createGithub({
    reviews: [
      {
        user: { login: "github-actions[bot]" },
        commit_id: request.headSha,
        state: "COMMENTED",
        body: "<!-- ai-code-review:abc123 -->",
      },
    ],
  });
  await publishCodeReview({ ...request, github });
  assert.equal(published.length, 0);
});

test("사람이 복사한 완료 표시는 봇 리뷰를 생략시키지 않는다", async () => {
  const { github, published } = createGithub({
    reviews: [
      {
        user: { login: "owner" },
        commit_id: request.headSha,
        state: "COMMENTED",
        body: "<!-- ai-code-review:abc123 -->",
      },
    ],
  });
  await publishCodeReview({ ...request, github });
  assert.equal(published.length, 1);
});

test("검토할 수 없는 diff·비밀 파일은 성공으로 건너뛰지 않는다", () => {
  for (const input of [
    [{ filename: "src/large.ts" }],
    [{ filename: ".env.local", patch: "+SECRET=value" }],
    Array(31).fill(files[0]),
  ])
    assert.throws(() => selectReviewFiles(input));
  assert.deepEqual(
    selectReviewFiles([{ filename: "photo.png" }, ...files]),
    files,
  );
});

test("로컬 모델의 잘린 출력·문맥 초과를 성공으로 취급하지 않는다", async () => {
  for (const result of [
    { done: false },
    { done: true, done_reason: "length" },
    { done: true, prompt_eval_count: 32_000 },
  ]) {
    await assert.rejects(
      reviewWithOllama({
        model: "test-local-model",
        file: files[0],
        source: "new",
        conventions: {},
        relatedChanges: [],
        request: async (url) => {
          assert.equal(url, "http://127.0.0.1:11434/api/chat");
          return {
            ok: true,
            json: async () => ({
              message: { content: serializeReview() },
              ...result,
            }),
          };
        },
      }),
    );
  }
});
