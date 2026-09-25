import assert from "node:assert/strict";
import test from "node:test";

import {
  parseCodeReview,
  publishCodeReview,
} from "../../scripts/code-review/publishCodeReview.mjs";
import { readOllamaStream } from "../../scripts/code-review/readOllamaStream.mjs";
import { readRelatedSources } from "../../scripts/code-review/readRelatedSources.mjs";
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
          return new Response(
            JSON.stringify({
              message: { content: serializeReview() },
              ...result,
            }),
          );
        },
      }),
    );
  }
});

test("스트리밍 한글과 JSON 조각을 복원하고 추론 텍스트는 결과에서 제외한다", async () => {
  const raw = serializeReview([]);
  const wire = [
    { message: { thinking: "검토 중" } },
    { message: { content: raw.slice(0, 30) } },
    { message: { content: raw.slice(30) } },
    { done: true, done_reason: "stop", prompt_eval_count: 100 },
  ]
    .map(JSON.stringify)
    .join("\n");
  const bytes = new TextEncoder().encode(wire);
  const response = new Response(
    new ReadableStream({
      start(controller) {
        for (let index = 0; index < bytes.length; index += 7)
          controller.enqueue(bytes.slice(index, index + 7));
        controller.close();
      },
    }),
  );
  const result = await readOllamaStream(response);
  assert.equal(result.message.content, raw);
  assert.equal(result.message.thinking, undefined);
  assert.equal(result.done, true);
});

test("스트림 중단·오류·잘못된 JSON·완료 이후 데이터는 거부한다", async () => {
  for (const wire of [
    JSON.stringify({ message: { content: serializeReview([]) } }),
    '{"error":"failed"}',
    "not-json",
    '{"done":true}\n{"message":{"content":"extra"}}',
  ])
    await assert.rejects(readOllamaStream(new Response(wire)));
});

test("추론 없이 관련 코드를 포함한 스트리밍 응답을 리뷰 함수가 처리한다", async () => {
  const relatedSources = [
    { path: "src/helper.ts", source: "export const x = 1;" },
  ];
  const raw = await reviewWithOllama({
    model: "gemma4:12b",
    file: files[0],
    source: "new",
    conventions: {},
    relatedChanges: [],
    relatedSources,
    request: async (url, options) => {
      const payload = JSON.parse(options.body);
      assert.equal(payload.stream, true);
      assert.equal(payload.think, false);
      assert.equal(payload.options.num_predict, 2048);
      assert.deepEqual(
        JSON.parse(payload.messages[1].content).relatedSources,
        relatedSources,
      );
      return new Response(
        JSON.stringify({
          done: true,
          done_reason: "stop",
          prompt_eval_count: 100,
          message: { content: serializeReview([]) },
        }),
      );
    },
  });
  assert.deepEqual(parseCodeReview(raw, files).comments, []);
});

test("관련 코드는 src 경계와 같은 커밋에서만 읽고 중복·외부 경로를 제외한다", async () => {
  const calls = [];
  const related = await readRelatedSources({
    filename: "src/feature/main.ts",
    sha: "fixed-sha",
    source: `import x from "@/helper"; import y from "../helper"; import z from "../../.env"; import a from "@/../secret"; import react from "react";`,
    readFile: async (path, sha) => {
      calls.push({ path, sha });
      return "export const value = 1;";
    },
  });
  assert.deepEqual(calls, [{ path: "src/helper.ts", sha: "fixed-sha" }]);
  assert.equal(related.length, 1);
});

test("관련 파일의 404만 건너뛰고 인증 실패는 숨기지 않는다", async () => {
  const input = {
    filename: "src/main.ts",
    source: 'import x from "@/missing";',
    sha: "sha",
  };
  assert.deepEqual(
    await readRelatedSources({
      ...input,
      readFile: async () => {
        throw new Error("GitHub 요청 실패: 404 GET path");
      },
    }),
    [],
  );
  await assert.rejects(
    readRelatedSources({
      ...input,
      readFile: async () => {
        throw new Error("GitHub 요청 실패: 401 GET path");
      },
    }),
  );
});
