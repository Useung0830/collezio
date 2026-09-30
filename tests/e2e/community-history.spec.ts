import { randomUUID } from "node:crypto";

import type { APIRequestContext, Page } from "@playwright/test";

import { expect, test } from "./fixtures";

const documentsUrl =
  "http://127.0.0.1:8080/v1/projects/demo-collezio/databases/(default)/documents";
const headers = { Authorization: "Bearer owner" };

async function login(page: Page, request: APIRequestContext) {
  const email = `${randomUUID()}@example.com`;
  const password = "Test1234!";
  const response = await request.post(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key",
    { data: { email, password, returnSecureToken: true } },
  );
  expect(response.ok()).toBeTruthy();
  const { localId } = await response.json();
  await page.goto("/login");
  await page.getByLabel("이메일", { exact: true }).fill(email);
  await page.getByLabel("비밀번호", { exact: true }).fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
  return localId as string;
}

test("내 글·댓글: 로그인, 빈 목록, 페이지 조회, 삭제 원문 제외, 오류 복구와 계정 전환", async ({
  page,
  request,
  context,
}) => {
  await page.goto("/posts");
  await expect(
    page.getByText("후 내가 쓴 글과 댓글을 확인할 수 있습니다.", {
      exact: false,
    }),
  ).toBeVisible();
  const userId = await login(page, request);
  await page.goto("/posts");
  await expect(page.getByText("아직 작성한 게시글이 없습니다.")).toBeVisible();
  const postIds = Array.from({ length: 22 }, () => randomUUID());
  const commentIds = Array.from({ length: 22 }, () => randomUUID());
  const foreignPostId = postIds[21];
  try {
    for (const [index, id] of postIds.entries()) {
      const timestamp = new Date(Date.UTC(2026, 8, index + 1)).toISOString();
      const response = await request.patch(
        `${documentsUrl}/communityPosts/${id}`,
        {
          headers,
          data: {
            fields: {
              authorId: { stringValue: index === 21 ? "someone-else" : userId },
              title: {
                stringValue:
                  index === 21 ? "댓글의 원문" : `내 게시글 ${index}`,
              },
              content: { stringValue: "실제 본문" },
              images: { arrayValue: { values: [] } },
              createdAt: { timestampValue: timestamp },
              updatedAt: { timestampValue: timestamp },
              likeCount: { integerValue: "0" },
              viewCount: { integerValue: "0" },
            },
          },
        },
      );
      expect(response.ok()).toBeTruthy();
      expect(
        (
          await request.patch(
            `${documentsUrl}/communityComments/${commentIds[index]}`,
            {
              headers,
              data: {
                fields: {
                  authorId: { stringValue: userId },
                  postId: {
                    stringValue:
                      index === 21 ? "deleted-parent" : foreignPostId,
                  },
                  content: { stringValue: `내 댓글 ${index}` },
                  createdAt: { timestampValue: timestamp },
                  updatedAt: { timestampValue: timestamp },
                },
              },
            },
          )
        ).ok(),
      ).toBeTruthy();
    }
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
    await page.reload();
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "내 게시글을 불러오지 못했습니다" }),
    ).toBeVisible();
    await page.unroute("http://127.0.0.1:8080/**");
    await page.getByRole("button", { name: "내 게시글 다시 조회" }).click();
    const panel = page.getByRole("tabpanel");
    await expect(panel.getByRole("heading", { level: 3 })).toHaveText(
      Array.from({ length: 20 }, (_, index) => `내 게시글 ${20 - index}`),
    );
    await page.getByRole("button", { name: "내 게시글 더보기" }).click();
    await expect(panel.getByRole("heading", { level: 3 })).toHaveCount(21);
    await page
      .getByRole("heading", { name: "내 게시글 20", exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`/community/${postIds[20]}$`));
    await page.getByRole("button", { name: "수정", exact: true }).click();
    await page.getByLabel("게시글 제목").fill("내 목록 반영 수정");
    await page.getByRole("button", { name: "수정 완료" }).click();
    await expect(
      page.getByRole("heading", { name: "내 목록 반영 수정", exact: true }),
    ).toBeVisible();
    await page.goBack();
    await expect(
      panel.getByRole("heading", { name: "내 목록 반영 수정", exact: true }),
    ).toBeVisible();
    await page.getByRole("tab", { name: "댓글", exact: true }).click();
    await expect(panel.getByRole("heading", { level: 3 })).toHaveCount(19);
    await expect(panel.getByText("내 댓글 21", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "내 댓글 더보기" }).click();
    await expect(panel.getByRole("heading", { level: 3 })).toHaveCount(21);
    await panel
      .getByRole("heading", { name: "내 댓글 20", exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`/community/${foreignPostId}$`));
    await page.goBack();
    await page.getByRole("tab", { name: "댓글", exact: true }).click();
    await request.delete(`${documentsUrl}/communityPosts/${foreignPostId}`, {
      headers,
    });
    await page.reload();
    await page.getByRole("tab", { name: "댓글", exact: true }).click();
    await expect(
      panel.getByText("표시할 댓글이 없습니다.", { exact: false }),
    ).toBeVisible();
    await expect(panel.getByRole("heading", { level: 3 })).toHaveCount(0);
    await page.getByRole("tab", { name: "게시글", exact: true }).click();
    await expect(
      panel.getByRole("heading", { name: "내 목록 반영 수정", exact: true }),
    ).toBeVisible();
    const otherPage = await context.newPage();
    try {
      await login(otherPage, request);
      await expect(
        page.getByText("아직 작성한 게시글이 없습니다."),
      ).toBeVisible();
      await expect(panel.getByRole("heading", { level: 3 })).toHaveCount(0);
      await page.getByRole("tab", { name: "댓글", exact: true }).click();
      await expect(
        panel.getByText("표시할 댓글이 없습니다.", { exact: false }),
      ).toBeVisible();
    } finally {
      await otherPage.close();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
  } finally {
    for (const id of postIds)
      await request.delete(`${documentsUrl}/communityPosts/${id}`, { headers });
    for (const id of commentIds)
      await request.delete(`${documentsUrl}/communityComments/${id}`, {
        headers,
      });
  }
});
