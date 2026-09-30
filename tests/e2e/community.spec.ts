import { randomUUID } from "node:crypto";

import { expect, test } from "./fixtures";

const documentsUrl =
  "http://127.0.0.1:8080/v1/projects/demo-collezio/databases/(default)/documents/communityPosts";

test("커뮤니티 공개 목록: 빈 상태, 최신순 페이지 조회, 상세와 없는 글", async ({
  page,
  request,
}) => {
  const ids = Array.from({ length: 21 }, () => randomUUID());
  await page.goto("/community");
  await expect(page.getByText("아직 작성된 게시글이 없습니다.")).toBeVisible();
  try {
    for (const [index, id] of ids.entries()) {
      const timestamp = new Date(Date.UTC(2026, 8, index + 1)).toISOString();
      const response = await request.patch(`${documentsUrl}/${id}`, {
        headers: { Authorization: "Bearer owner" },
        data: {
          fields: {
            authorId: { stringValue: "test-author" },
            title: { stringValue: `커뮤니티 테스트 ${index}` },
            content: { stringValue: `테스트 본문 ${index}` },
            images: { arrayValue: { values: [] } },
            createdAt: { timestampValue: timestamp },
            updatedAt: { timestampValue: timestamp },
            likeCount: { integerValue: "0" },
            viewCount: { integerValue: "0" },
          },
        },
      });
      expect(response.ok()).toBeTruthy();
    }
    await page.reload();
    const titles = page
      .getByRole("heading", { level: 2 })
      .filter({ hasText: "커뮤니티 테스트" });
    await expect(titles).toHaveText(
      Array.from({ length: 20 }, (_, index) => `커뮤니티 테스트 ${20 - index}`),
    );
    await page.getByRole("button", { name: "더보기", exact: true }).click();
    await expect(titles).toHaveCount(21);
    await expect(
      page.getByRole("button", { name: "더보기", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("heading", { name: "커뮤니티 테스트 20", exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`/community/${ids[20]}$`));
    await expect(
      page.getByRole("heading", { level: 1, name: "커뮤니티 테스트 20" }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText("테스트 본문 20", { exact: true }),
    ).toBeVisible();
    await page.goto(`/community/${randomUUID()}`);
    await expect(
      page.getByText("존재하지 않거나 삭제된 게시글입니다."),
    ).toBeVisible();
  } finally {
    for (const id of ids)
      await request.delete(`${documentsUrl}/${id}`, {
        headers: { Authorization: "Bearer owner" },
      });
  }
});

test("로그인 사용자 글쓰기: 검증, 저장, 새로고침, 목록 반영", async ({
  page,
  request,
}) => {
  const email = `${randomUUID()}@example.com`;
  const password = "Test1234!";
  const response = await request.post(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key",
    { data: { email, password, returnSecureToken: true } },
  );
  expect(response.ok()).toBeTruthy();
  await page.goto("/community/new");
  await expect(
    page.getByText("로그인 후 게시글을 작성할 수 있습니다."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "작성 완료" })).toHaveCount(0);
  await page.goto("/login");
  await page.getByLabel("이메일", { exact: true }).fill(email);
  await page.getByLabel("비밀번호", { exact: true }).fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
  await page.goto("/community");
  await expect(page.getByText("아직 작성된 게시글이 없습니다.")).toBeVisible();
  await page.getByRole("link", { name: "글쓰기", exact: true }).click();
  await page.getByLabel("게시글 제목").fill("   ");
  await page.getByLabel("게시글 내용").fill("본문\n둘째 줄");
  await page.getByRole("button", { name: "작성 완료" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "제목은" }),
  ).toHaveText("제목은 1~100자로 입력해주세요.");
  const title = `작성 테스트 ${randomUUID()}`;
  await page.getByLabel("게시글 제목").fill(title);
  let postId: string | undefined;
  try {
    await page
      .locator("form")
      .filter({ has: page.getByLabel("게시글 제목") })
      .evaluate((form: HTMLFormElement) => {
        form.requestSubmit();
        form.requestSubmit();
      });
    await expect(page).toHaveURL(/\/community\/(?!new$)[^/]+$/);
    postId = new URL(page.url()).pathname.split("/").at(-1);
    await expect(
      page.getByRole("heading", { level: 1, name: title }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText("본문\n둘째 줄", { exact: true }),
    ).toBeVisible();
    await page.getByRole("link", { name: "게시글 목록", exact: true }).click();
    await expect(
      page.getByRole("heading", { level: 2, name: title }),
    ).toHaveCount(1);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
  } finally {
    if (postId)
      await request.delete(`${documentsUrl}/${postId}`, {
        headers: { Authorization: "Bearer owner" },
      });
  }
});

test("상세 조회 실패를 표시하고 다시 시도할 수 있다", async ({ page }) => {
  await page.route("http://127.0.0.1:8080/**", (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: 403,
          status: "PERMISSION_DENIED",
          message: "test denied",
        },
      }),
    }),
  );
  const path = `/community/${randomUUID()}`;
  await page.goto(path);
  await expect(
    page.getByRole("alert").filter({ hasText: "게시글을" }),
  ).toHaveText("게시글을 불러오지 못했습니다.");
  await page.unroute("http://127.0.0.1:8080/**");
  await page.getByRole("button", { name: "다시 시도" }).click();
  await expect(
    page.getByText("존재하지 않거나 삭제된 게시글입니다."),
  ).toBeVisible();
});
