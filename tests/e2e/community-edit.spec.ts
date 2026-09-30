import { randomUUID } from "node:crypto";

import { expect, test } from "./fixtures";

const documentsUrl =
  "http://127.0.0.1:8080/v1/projects/demo-collezio/databases/(default)/documents";
const headers = { Authorization: "Bearer owner" };

test("작성자 수정: 사진 교체, 취소, 동시 수정 충돌, 타인 버튼 숨김, 삭제 확인", async ({
  page,
  request,
  browser,
}) => {
  const email = `${randomUUID()}@example.com`;
  const password = "Test1234!";
  const account = await request.post(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key",
    { data: { email, password, returnSecureToken: true } },
  );
  expect(account.ok()).toBeTruthy();
  await page.goto("/login");
  await page.getByLabel("이메일", { exact: true }).fill(email);
  await page.getByLabel("비밀번호", { exact: true }).fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
  await page.goto("/community/new");
  const photo = {
    name: "original.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf1sAAAAASUVORK5CYII=",
      "base64",
    ),
  };
  await page.getByLabel("게시글 제목").fill("수정할 게시글");
  await page.getByLabel("게시글 내용").fill("수정 전 본문");
  await page.getByLabel("사진 첨부").setInputFiles(photo);
  await page.getByRole("button", { name: "작성 완료" }).click();
  await expect(page).toHaveURL(/\/community\/(?!new$)[^/]+$/);
  const postId = new URL(page.url()).pathname.split("/").at(-1)!;
  const postUrl = `${documentsUrl}/communityPosts/${postId}`;
  const postPath = `/community/${postId}`;
  const originalData = await (await request.get(postUrl, { headers })).json();
  const originalPath =
    originalData.fields.images.arrayValue.values[0].mapValue.fields.path
      .stringValue;
  let updatedPath: string | undefined;
  try {
    const guest = await browser.newContext();
    const guestPage = await guest.newPage();
    await guestPage.goto(`http://127.0.0.1:3100${postPath}`);
    await expect(
      guestPage.getByRole("heading", { name: "수정할 게시글", exact: true }),
    ).toBeVisible();
    await expect(
      guestPage.getByRole("button", { name: "수정", exact: true }),
    ).toHaveCount(0);
    await expect(
      guestPage.getByRole("button", { name: "삭제", exact: true }),
    ).toHaveCount(0);
    await guest.close();
    await page.getByRole("button", { name: "수정", exact: true }).click();
    await page.getByLabel("게시글 제목").fill("취소할 제목");
    await page.getByRole("button", { name: "기존 사진 1 제거" }).click();
    await page.getByRole("button", { name: "취소", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "수정할 게시글", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: "수정할 게시글 게시물 이미지 1" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "수정", exact: true }).click();
    await page.getByLabel("게시글 제목").fill(" ");
    await page.getByRole("button", { name: "수정 완료" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "제목은" }),
    ).toBeVisible();
    await page.getByLabel("게시글 제목").fill("수정 완료 제목");
    await page.getByLabel("게시글 내용").fill("수정 완료 본문");
    await page.getByRole("button", { name: "기존 사진 1 제거" }).click();
    await page
      .getByLabel("사진 첨부")
      .setInputFiles({ ...photo, name: "replacement.png" });
    await page.getByRole("button", { name: "수정 완료" }).click();
    await expect(
      page.getByRole("heading", { name: "수정 완료 제목", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("게시글을 수정했습니다.", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText("수정 완료 본문", { exact: true }),
    ).toBeVisible();
    const image = page.getByRole("img", {
      name: "수정 완료 제목 게시물 이미지 1",
    });
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.naturalWidth),
      )
      .toBeGreaterThan(0);
    const updated = await (await request.get(postUrl, { headers })).json();
    updatedPath =
      updated.fields.images.arrayValue.values[0].mapValue.fields.path
        .stringValue;
    expect(updatedPath).not.toBe(originalPath);
    const removed = await request.get(
      `http://127.0.0.1:9199/v0/b/demo-collezio.appspot.com/o/${encodeURIComponent(originalPath)}`,
      { headers },
    );
    expect(removed.status()).toBe(404);
    await page.getByRole("button", { name: "수정", exact: true }).click();
    await page.getByLabel("게시글 내용").fill("오래된 버전 수정");
    const concurrent = await request.patch(
      `${postUrl}?updateMask.fieldPaths=title&updateMask.fieldPaths=updatedAt`,
      {
        headers,
        data: {
          fields: {
            title: { stringValue: "다른 탭에서 수정한 제목" },
            updatedAt: {
              timestampValue: new Date(Date.now() + 1000).toISOString(),
            },
          },
        },
      },
    );
    expect(concurrent.ok()).toBeTruthy();
    await page.getByRole("button", { name: "수정 완료" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "다른 곳에서 수정" }),
    ).toBeVisible();
    await expect(page.getByLabel("게시글 내용")).toHaveValue(
      "오래된 버전 수정",
    );
    await page.getByRole("button", { name: "취소", exact: true }).click();
    await page.reload();
    await expect(
      page.getByRole("heading", {
        name: "다른 탭에서 수정한 제목",
        exact: true,
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "삭제", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("button", { name: "삭제", exact: true }).click();
    await page.route("http://127.0.0.1:9199/**", (route) =>
      route.request().method() === "DELETE"
        ? route.fulfill({
            status: 403,
            contentType: "application/json",
            body: JSON.stringify({
              error: { code: 403, message: "test cleanup denied" },
            }),
          })
        : route.continue(),
    );
    await page.getByRole("button", { name: "삭제 확인", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "삭제 정리 다시 시도" }),
    ).toBeVisible();
    await page.unroute("http://127.0.0.1:9199/**");
    await page.reload();
    await page.getByRole("button", { name: "삭제 정리 다시 시도" }).click();
    await page.getByRole("button", { name: "삭제 확인", exact: true }).click();
    await expect(page).toHaveURL("http://127.0.0.1:3100/community");
    expect((await request.get(postUrl, { headers })).status()).toBe(404);
    expect(
      (
        await request.get(`${documentsUrl}/communityPostDeletions/${postId}`, {
          headers,
        })
      ).status(),
    ).toBe(404);
    expect(
      (
        await request.get(
          `http://127.0.0.1:9199/v0/b/demo-collezio.appspot.com/o/${encodeURIComponent(updatedPath!)}`,
          { headers },
        )
      ).status(),
    ).toBe(404);
  } finally {
    await request.delete(postUrl, { headers });
    await request.delete(`${documentsUrl}/communityPostDeletions/${postId}`, {
      headers,
    });
    for (const path of [originalPath, updatedPath].filter(Boolean))
      await request.delete(
        `http://127.0.0.1:9199/v0/b/demo-collezio.appspot.com/o/${encodeURIComponent(path!)}`,
        { headers },
      );
  }
});
