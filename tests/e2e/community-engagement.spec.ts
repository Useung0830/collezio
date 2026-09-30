import { randomUUID } from "node:crypto";

import { expect, test } from "./fixtures";

const documentsUrl =
  "http://127.0.0.1:8080/v1/projects/demo-collezio/databases/(default)/documents";
const headers = { Authorization: "Bearer owner" };

test("댓글과 좋아요: 로그인 안내, 저장 실패 복구, 수정·삭제와 새로고침", async ({
  page,
  request,
}) => {
  const postId = randomUUID();
  const email = `${randomUUID()}@example.com`;
  const password = "Test1234!";
  const account = await request.post(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key",
    { data: { email, password, returnSecureToken: true } },
  );
  expect(account.ok()).toBeTruthy();
  const timestamp = new Date().toISOString();
  const postUrl = `${documentsUrl}/communityPosts/${postId}`;
  expect(
    (
      await request.patch(postUrl, {
        headers,
        data: {
          fields: {
            authorId: { stringValue: "other-author" },
            title: { stringValue: "소통 테스트" },
            content: { stringValue: "본문" },
            images: { arrayValue: { values: [] } },
            createdAt: { timestampValue: timestamp },
            updatedAt: { timestampValue: timestamp },
            likeCount: { integerValue: "0" },
            viewCount: { integerValue: "0" },
          },
        },
      })
    ).ok(),
  ).toBeTruthy();
  try {
    await page.goto(`/community/${postId}`);
    await expect(
      page.getByText("후 댓글을 작성할 수 있습니다.", { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "좋아요 0", exact: true }),
    ).toBeDisabled();
    await page.goto("/login");
    await page.getByLabel("이메일", { exact: true }).fill(email);
    await page.getByLabel("비밀번호", { exact: true }).fill(password);
    await page.getByRole("button", { name: "로그인", exact: true }).click();
    await expect(page).toHaveURL("http://127.0.0.1:3100/");
    await page.goto(`/community/${postId}`);
    await page.getByRole("button", { name: "좋아요 0", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "좋아요 1", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(
      page.getByRole("button", { name: "좋아요 1", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "좋아요 1", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "좋아요 0", exact: true }),
    ).toHaveAttribute("aria-pressed", "false");
    await page.getByLabel("댓글 내용", { exact: true }).fill("유지할 댓글");
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
    await page.getByRole("button", { name: "댓글 등록", exact: true }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "댓글을 저장하지 못했습니다" }),
    ).toBeVisible();
    await expect(page.getByLabel("댓글 내용", { exact: true })).toHaveValue(
      "유지할 댓글",
    );
    await page.unroute("http://127.0.0.1:8080/**");
    await page
      .getByRole("form", { name: "댓글 작성" })
      .evaluate((form: HTMLFormElement) => {
        form.requestSubmit();
        form.requestSubmit();
      });
    await expect(
      page.getByRole("listitem").getByText("유지할 댓글", { exact: true }),
    ).toHaveCount(1);
    await page.reload();
    await expect(page.getByText("유지할 댓글", { exact: true })).toHaveCount(1);
    await page.getByRole("button", { name: "댓글 수정", exact: true }).click();
    await page.getByLabel("수정할 댓글 내용").fill("수정한 댓글");
    await page
      .getByRole("button", { name: "댓글 수정 완료", exact: true })
      .click();
    await expect(page.getByText("수정한 댓글", { exact: true })).toBeVisible();
    await expect(page.getByText("(수정됨)", { exact: false })).toBeVisible();
    await page.getByRole("button", { name: "댓글 삭제", exact: true }).click();
    await page
      .getByRole("button", { name: "댓글 삭제 확인", exact: true })
      .click();
    await expect(page.getByText("아직 작성된 댓글이 없습니다.")).toBeVisible();
  } finally {
    const comments = await request.post(`${documentsUrl}:runQuery`, {
      headers,
      data: {
        structuredQuery: {
          from: [{ collectionId: "communityComments" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "postId" },
              op: "EQUAL",
              value: { stringValue: postId },
            },
          },
        },
      },
    });
    for (const result of await comments.json())
      if (result.document)
        await request.delete(
          `http://127.0.0.1:8080/v1/${result.document.name}`,
          { headers },
        );
    await request.delete(postUrl, { headers });
  }
});
