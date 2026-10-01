import { randomUUID } from "node:crypto";

import type { APIRequestContext, Page } from "@playwright/test";

import { expect, test } from "./fixtures";

const authUrl = "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1";
const documentsUrl =
  "http://127.0.0.1:8080/v1/projects/demo-collezio/databases/(default)/documents";
const password = "Test1234!";

async function login(page: Page, request: APIRequestContext) {
  const email = `${randomUUID()}@example.com`;
  const response = await request.post(
    `${authUrl}/accounts:signUp?key=demo-api-key`,
    { data: { email, password, returnSecureToken: true } },
  );
  expect(response.ok()).toBeTruthy();
  const account: unknown = await response.json();
  if (
    !account ||
    typeof account !== "object" ||
    !("localId" in account) ||
    typeof account.localId !== "string"
  )
    throw new Error("사용자 ID 없음");
  await page.goto("/login");
  await page.getByLabel("이메일", { exact: true }).fill(email);
  await page.getByLabel("비밀번호", { exact: true }).fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
  return { email, userId: account.localId };
}

test("탈퇴 양식 취소·재인증 실패 후 재시도와 계정 삭제·다른 탭 반영", async ({
  page,
  request,
  context,
}) => {
  const { email, userId } = await login(page, request);
  await page.goto("/collections");
  await page.getByRole("button", { name: "탈퇴하기", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "회원 탈퇴", exact: true });
  await dialog.getByLabel("거래 안전성 및 신뢰에 대한 우려").check();
  await dialog.getByRole("button", { name: "취소", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "탈퇴하기", exact: true }).click();
  await expect(
    dialog.getByLabel("거래 안전성 및 신뢰에 대한 우려"),
  ).not.toBeChecked();
  await dialog.getByLabel("거래 안전성 및 신뢰에 대한 우려").check();
  await dialog
    .getByLabel("탈퇴 사유 상세 입력")
    .fill("더 편리한 서비스를 기대합니다.");
  await dialog.getByLabel("본인 확인을 위한 비밀번호").fill("wrong-password");
  await dialog.getByRole("button", { name: "회원 탈퇴", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText(
    "비밀번호가 올바르지 않습니다",
  );
  await expect(dialog.getByLabel("탈퇴 사유 상세 입력")).toHaveValue(
    "더 편리한 서비스를 기대합니다.",
  );
  const observer = await context.newPage();
  await observer.goto("/collections");
  await dialog.getByLabel("본인 확인을 위한 비밀번호").fill(password);
  await dialog.getByRole("button", { name: "회원 탈퇴", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/", { timeout: 60_000 });
  await expect(
    page.getByText("회원 탈퇴가 완료되었습니다.", { exact: true }),
  ).toBeVisible();
  await expect(
    observer.getByText("로그인하면 내가 등록한 상품을 확인할 수 있습니다.", {
      exact: true,
    }),
  ).toBeVisible();
  const status = await request.get(
    `${documentsUrl}/withdrawalRequests/${userId}`,
    { headers: { Authorization: "Bearer owner" } },
  );
  expect((await status.json()).fields.status.stringValue).toBe("completed");
  const loginResponse = await request.post(
    `${authUrl}/accounts:signInWithPassword?key=demo-api-key`,
    { data: { email, password, returnSecureToken: true } },
  );
  expect(loginResponse.ok()).toBeFalsy();
  await page.reload();
  await page.goto("/collections");
  await expect(
    page.getByText("로그인하면 내가 등록한 상품을 확인할 수 있습니다.", {
      exact: true,
    }),
  ).toBeVisible();
  await observer.close();
});

test("모바일은 빈 피드백으로 탈퇴할 수 있고 처리 중 닫기·중복 제출을 막는다", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, request);
  await page.getByRole("button", { name: "메뉴 열기" }).click();
  await page.getByRole("button", { name: "탈퇴하기", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "회원 탈퇴", exact: true });
  await dialog.getByLabel("본인 확인을 위한 비밀번호").fill(password);
  let release: (() => void) | undefined;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/asia-northeast3/withdrawAccount", async (route) => {
    await pending;
    await route.continue();
  });
  await dialog.getByRole("button", { name: "회원 탈퇴", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "회원 탈퇴", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "취소", exact: true }),
  ).toBeDisabled();
  release?.();
  await expect(
    page.getByText("회원 탈퇴가 완료되었습니다.", { exact: true }),
  ).toBeVisible({ timeout: 60_000 });
  await expect(dialog).not.toBeVisible();
});
