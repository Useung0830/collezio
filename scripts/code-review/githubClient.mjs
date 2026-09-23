import { spawnSync } from "node:child_process";

export const REVIEW_CONTEXT = "Local Code Review";
export const REPOSITORY = "Useung0830/collezio";

export function getGithubToken() {
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  const result = spawnSync("git", ["credential", "fill"], {
    input: "protocol=https\nhost=github.com\n\n",
    encoding: "utf8",
    windowsHide: true,
    timeout: 15_000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GCM_INTERACTIVE: "never" },
  });
  const token = result.stdout
    ?.split("\n")
    .find((line) => line.startsWith("password="))
    ?.slice(9)
    .trim();
  if (!token)
    throw new Error(
      "GitHub 인증이 필요합니다. Git 로그인 또는 GH_TOKEN을 설정해주세요.",
    );
  return token;
}

export function createGithubClient(token) {
  async function request(path, { method = "GET", body } = {}) {
    const response = await fetch(`https://api.github.com${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      ...(body && { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(30_000),
      redirect: "error",
    });
    if (!response.ok)
      throw new Error(`GitHub 요청 실패: ${response.status} ${method} ${path}`);
    return response.json();
  }

  async function list(path) {
    const items = [];
    for (let page = 1; page <= 30; page++) {
      const data = await request(
        `${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}`,
      );
      items.push(...data);
      if (data.length < 100) return items;
    }
    throw new Error("GitHub 목록이 너무 큽니다. 검토 범위를 나눠주세요.");
  }

  const pullPath = ({ owner, repo, pull_number }) =>
    `/repos/${owner}/${repo}/pulls/${pull_number}`;

  return {
    request,
    list,
    // Match the small GitHub client interface used by the review publisher.
    paginate: (method, parameters) => method(parameters),
    rest: {
      pulls: {
        get: async (parameters) => ({
          data: await request(pullPath(parameters)),
        }),
        listFiles: (parameters) => list(`${pullPath(parameters)}/files`),
        listReviews: (parameters) => list(`${pullPath(parameters)}/reviews`),
        createReview: ({ owner, repo, pull_number, ...body }) =>
          request(`${pullPath({ owner, repo, pull_number })}/reviews`, {
            method: "POST",
            body,
          }),
      },
    },
  };
}

export async function setReviewStatus(github, sha, state, description) {
  await github.request(`/repos/${REPOSITORY}/statuses/${sha}`, {
    method: "POST",
    body: { state, context: REVIEW_CONTEXT, description },
  });
}
