const MAX_FINDINGS = 30;
const MAX_REVIEW_LENGTH = 100_000;

export function getDiffLines(patch = "") {
  const lines = { LEFT: new Set(), RIGHT: new Set() };
  let left = 0;
  let right = 0;
  let isHunk = false;

  for (const line of patch.split("\n")) {
    const hunk = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (hunk) {
      left = Number(hunk[1]);
      right = Number(hunk[2]);
      isHunk = true;
    } else if (isHunk && line.startsWith("+")) {
      lines.RIGHT.add(right++);
    } else if (isHunk && line.startsWith("-")) {
      lines.LEFT.add(left++);
    } else if (isHunk && line.startsWith(" ")) {
      lines.LEFT.add(left++);
      lines.RIGHT.add(right++);
    }
  }
  return lines;
}

export function parseCodeReview(rawReview, files) {
  if (typeof rawReview !== "string" || rawReview.length > MAX_REVIEW_LENGTH) {
    throw new Error("리뷰 결과가 없거나 허용 크기를 초과했습니다.");
  }
  const review = JSON.parse(rawReview);
  if (
    review?.complete !== true ||
    typeof review.summary !== "string" ||
    !review.summary.trim() ||
    review.summary.length > 5000 ||
    !Array.isArray(review.findings) ||
    review.findings.length > MAX_FINDINGS
  ) {
    throw new Error("리뷰가 완료되지 않았거나 결과 형식이 올바르지 않습니다.");
  }

  const changedFiles = new Map(
    files.map((file) => [file.filename, getDiffLines(file.patch)]),
  );
  const comments = review.findings.map((finding) => {
    if (
      !finding ||
      typeof finding.path !== "string" ||
      !["LEFT", "RIGHT"].includes(finding.side) ||
      !Number.isSafeInteger(finding.line) ||
      !changedFiles.get(finding.path)?.[finding.side].has(finding.line) ||
      typeof finding.body !== "string" ||
      !finding.body.trim() ||
      finding.body.length > 5000
    ) {
      throw new Error(
        `리뷰 지적의 위치 또는 내용이 올바르지 않습니다: ${finding?.path}:${finding?.line} (${finding?.side})`,
      );
    }
    return {
      path: finding.path,
      line: finding.line,
      side: finding.side,
      body: finding.body,
    };
  });
  return { summary: review.summary, comments };
}

export async function publishCodeReview({
  github,
  owner,
  repo,
  pullNumber,
  headSha,
  rawReview,
  reviewerLogin = "github-actions[bot]",
}) {
  const request = { owner, repo, pull_number: pullNumber };
  const assertCurrentPullRequest = async () => {
    const { data: pullRequest } = await github.rest.pulls.get(request);
    if (
      pullRequest.state !== "open" ||
      pullRequest.draft ||
      pullRequest.head.sha !== headSha ||
      pullRequest.head.repo?.full_name !== `${owner}/${repo}`
    ) {
      throw new Error(
        "현재 PR 커밋에 대한 리뷰가 아닙니다. 최신 실행을 확인해주세요.",
      );
    }
  };
  await assertCurrentPullRequest();
  const files = await github.paginate(github.rest.pulls.listFiles, request);
  const { summary, comments } = parseCodeReview(rawReview, files);
  const marker = `<!-- ai-code-review:${headSha} -->`;
  const reviews = await github.paginate(github.rest.pulls.listReviews, request);
  const hasPublishedReview = reviews.some(
    (review) =>
      review.user?.login === reviewerLogin &&
      review.commit_id === headSha &&
      review.state === "COMMENTED" &&
      review.body?.includes(marker),
  );
  if (hasPublishedReview) return;

  // Recheck after pagination so a newer push cannot inherit an older review.
  await assertCurrentPullRequest();
  await github.rest.pulls.createReview({
    ...request,
    commit_id: headSha,
    event: "COMMENT",
    body: `${marker}\n## 코드 리뷰\n\n${summary}\n\n${
      comments.length
        ? "각 지적을 확인하고 처리한 뒤 **Resolve conversation**을 눌러주세요. 모든 리뷰 대화가 해결되고 필수 검사가 통과하면 dev PR이 자동 병합됩니다."
        : "추가 지적이 없습니다. 기존 미해결 대화가 없고 필수 검사가 통과하면 dev PR이 자동 병합됩니다."
    }`,
    ...(comments.length > 0 && { comments }),
  });
}
