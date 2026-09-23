import { setTimeout as delay } from "node:timers/promises";

import {
  createGithubClient,
  getGithubToken,
  REPOSITORY,
  REVIEW_CONTEXT,
  setReviewStatus,
} from "./code-review/githubClient.mjs";
import {
  parseCodeReview,
  publishCodeReview,
} from "./code-review/publishCodeReview.mjs";
import { readRelatedSources } from "./code-review/readRelatedSources.mjs";
import {
  getConventionPaths,
  reviewWithOllama,
  selectReviewFiles,
} from "./code-review/reviewWithOllama.mjs";

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const isWatching = args.includes("--watch");
const prIndex = args.indexOf("--pr");
const pullNumber = prIndex >= 0 ? Number(args[prIndex + 1]) : null;
const model = process.env.LOCAL_REVIEW_MODEL || "qwen3.8:27b";
const repositoryPath = `/repos/${REPOSITORY}`;

if (
  (prIndex >= 0 && (!Number.isSafeInteger(pullNumber) || pullNumber <= 0)) ||
  (isWatching && isDryRun)
) {
  throw new Error(
    "사용법: node scripts/reviewPullRequests.mjs [--pr 번호] [--dry-run | --watch]",
  );
}

const log = (message) =>
  process.stdout.write(`${new Date().toISOString()} ${message}\n`);
const github = createGithubClient(getGithubToken());
const user = await github.request("/user");
const [owner, repo] = REPOSITORY.split("/");

async function checkLocalModel() {
  const response = await fetch("http://127.0.0.1:11434/api/tags", {
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("Ollama를 실행해주세요.");
  const data = await response.json();
  const installed = data.models?.find((item) => item.name === model);
  if (
    !installed ||
    installed.remote_model ||
    installed.remote_host ||
    /cloud/i.test(model)
  ) {
    throw new Error(`로컬에 다운로드된 모델만 사용합니다: ${model}`);
  }
}

async function readRemoteFile(path, sha) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const data = await github.request(
    `${repositoryPath}/contents/${encodedPath}?ref=${sha}`,
  );
  if (
    data.type !== "file" ||
    data.encoding !== "base64" ||
    typeof data.content !== "string" ||
    data.size > 100_000
  ) {
    throw new Error(`안전하게 읽을 수 없는 파일입니다: ${path}`);
  }
  return Buffer.from(data.content, "base64").toString("utf8");
}

async function reviewPullRequest(pullRequest) {
  const sha = pullRequest.head.sha;
  if (
    pullRequest.head.repo?.full_name !== REPOSITORY ||
    pullRequest.draft ||
    !["dev", "main"].includes(pullRequest.base.ref)
  )
    return;
  if (!isDryRun && pullRequest.state !== "open") return;
  if (!pullNumber && !isDryRun) {
    const statuses = await github.list(
      `${repositoryPath}/commits/${sha}/statuses`,
    );
    const previous = statuses.find(
      (status) => status.context === REVIEW_CONTEXT,
    );
    if (previous && ["success", "failure", "error"].includes(previous.state))
      return;
    if (
      previous?.state === "pending" &&
      Date.now() - Date.parse(previous.created_at) < 30 * 60_000
    )
      return;
  }

  log(
    `PR #${pullRequest.number} ${sha.slice(0, 7)} 리뷰 시작 (${model}, ${isDryRun ? "게시 없음" : "게시 모드"})`,
  );
  if (!isDryRun)
    await setReviewStatus(
      github,
      sha,
      "pending",
      "로컬 모델이 PR을 검토하고 있습니다.",
    );
  try {
    await checkLocalModel();
    const files = await github.list(
      `${repositoryPath}/pulls/${pullRequest.number}/files`,
    );
    const reviewFiles = selectReviewFiles(files);
    const conventionCache = new Map();
    const sourceCache = new Map();
    const readSource = async (path, ref) => {
      const key = `${ref}:${path}`;
      if (!sourceCache.has(key))
        sourceCache.set(key, await readRemoteFile(path, ref));
      return sourceCache.get(key);
    };
    const findings = [];
    const summaries = [];
    for (const file of reviewFiles) {
      log(`검토: ${file.filename}`);
      const conventions = {};
      for (const path of getConventionPaths(file.filename)) {
        if (!conventionCache.has(path))
          conventionCache.set(
            path,
            await readRemoteFile(path, pullRequest.base.sha),
          );
        conventions[path] = conventionCache.get(path);
      }
      const source = await readSource(
        file.status === "removed"
          ? file.previous_filename || file.filename
          : file.filename,
        file.status === "removed" ? pullRequest.base.sha : sha,
      );
      const relatedChanges = files
        .filter((item) => item.filename !== file.filename)
        .map((item) => ({ path: item.filename, status: item.status }));
      const relatedSources = await readRelatedSources({
        filename:
          file.status === "removed"
            ? file.previous_filename || file.filename
            : file.filename,
        source,
        sha: file.status === "removed" ? pullRequest.base.sha : sha,
        readFile: readSource,
      });
      const rawReview = await reviewWithOllama({
        model,
        file,
        source,
        conventions,
        relatedChanges,
        relatedSources,
      });
      const parsed = parseCodeReview(rawReview, [file]);
      findings.push(...parsed.comments);
      summaries.push(`${file.filename}: ${parsed.summary}`);
    }
    const omitted = files
      .filter((file) => !reviewFiles.includes(file))
      .map((file) => file.filename);
    const summary = `${model}로 텍스트 파일 ${reviewFiles.length}개를 검토했습니다.\n\n${
      omitted.length
        ? `검토 제외(바이너리/잠금 파일): ${omitted.join(", ")}\n\n`
        : ""
    }로컬 모델의 보조 리뷰이며, 지적이 없더라도 버그가 없음을 보장하지 않습니다.`;
    const rawReview = JSON.stringify({ complete: true, summary, findings });
    parseCodeReview(rawReview, files);
    if (isDryRun) {
      log(
        JSON.stringify({ model, sha, summary, summaries, findings }, null, 2),
      );
      return;
    }
    await publishCodeReview({
      github,
      owner,
      repo,
      pullNumber: pullRequest.number,
      headSha: sha,
      rawReview,
      reviewerLogin: user.login,
    });
    const current = await github.request(
      `${repositoryPath}/pulls/${pullRequest.number}`,
    );
    if (current.head.sha !== sha)
      throw new Error("리뷰 중 새 커밋이 올라왔습니다.");
    await setReviewStatus(
      github,
      sha,
      "success",
      `로컬 리뷰 게시 완료 · 지적 ${findings.length}개 · 대화 해결 후 병합`,
    );
    log(`PR #${pullRequest.number} 리뷰 게시 완료 (${findings.length}개 지적)`);
  } catch (error) {
    if (!isDryRun)
      await setReviewStatus(
        github,
        sha,
        "failure",
        "로컬 리뷰 실패. 실행 로그를 확인하고 해당 PR을 재실행해주세요.",
      );
    throw error;
  }
}

await checkLocalModel();
log(
  `리뷰 프로그램 시작 (${model}, 추론 활성화, ${isWatching ? "60초 간격 감시" : "단일 실행"})`,
);
do {
  try {
    const pullRequests = pullNumber
      ? [await github.request(`${repositoryPath}/pulls/${pullNumber}`)]
      : await github.list(`${repositoryPath}/pulls?state=open`);
    for (const pullRequest of pullRequests) {
      try {
        await reviewPullRequest(pullRequest);
      } catch (error) {
        process.stderr.write(`PR #${pullRequest.number}: ${error.message}\n`);
        if (!isWatching) process.exitCode = 1;
      }
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    if (!isWatching) process.exitCode = 1;
  }
  if (isWatching) await delay(60_000);
} while (isWatching);
