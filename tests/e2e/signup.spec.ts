import { randomUUID } from "node:crypto";

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

const TEST_PASSWORD = "Test1234!";

async function fillSignupForm(page: Page, email: string) {
  await page.getByLabel("이메일", { exact: true }).fill(email);
  await page.getByLabel("비밀번호", { exact: true }).fill(TEST_PASSWORD);
  await page.getByLabel("비밀번호 확인", { exact: true }).fill(TEST_PASSWORD);
  await page.getByLabel("닉네임", { exact: true }).fill("테스트회원");
  await page.locator('input[name="hasAcceptedTerms"]').check();
  await page.locator('input[name="hasAcceptedPrivacy"]').check();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/signup");
});

test("입력 전에는 회원가입 버튼이 비활성화된다", async ({ page }) => {
  await expect(
    page.getByRole("button", { name: "회원가입", exact: true }),
  ).toBeDisabled();
});

test("필수 약관에 모두 동의해야 회원가입 버튼이 활성화된다", async ({
  page,
}) => {
  await fillSignupForm(page, `${randomUUID()}@example.com`);
  const button = page.getByRole("button", { name: "회원가입", exact: true });

  for (const name of ["hasAcceptedTerms", "hasAcceptedPrivacy"]) {
    const checkbox = page.locator(`input[name="${name}"]`);
    await checkbox.uncheck();
    await expect(button).toBeDisabled();
    await checkbox.check();
    await expect(button).toBeEnabled();
  }
});

test("비밀번호가 다르면 오류를 표시한다", async ({ page }) => {
  await fillSignupForm(page, `${randomUUID()}@example.com`);
  await page.getByLabel("비밀번호 확인", { exact: true }).fill("Different123!");
  await page.getByRole("button", { name: "회원가입", exact: true }).click();

  await expect(
    page.getByText("비밀번호가 일치하지 않습니다.", { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/signup$/);
});

test("가입 성공 시 토스트를 표시하고 로그인으로 이동한다", async ({ page }) => {
  await fillSignupForm(page, `${randomUUID()}@example.com`);
  await page.getByRole("button", { name: "회원가입", exact: true }).click();

  await expect(
    page.getByText("회원가입이 완료되었습니다. 이메일 인증을 진행해주세요.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("이미 가입된 이메일이면 오류를 표시한다", async ({ page, request }) => {
  const email = `${randomUUID()}@example.com`;
  const response = await request.post(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key",
    { data: { email, password: TEST_PASSWORD, returnSecureToken: true } },
  );
  expect(response.ok()).toBeTruthy();

  await fillSignupForm(page, email);
  await page.getByRole("button", { name: "회원가입", exact: true }).click();

  await expect(
    page.getByText("이미 사용 중인 이메일입니다.", { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/signup$/);
});
