import { randomUUID } from "node:crypto";

import { expect, test } from "./fixtures";

test("로그인 성공 시 홈으로 이동한다", async ({ page, request }) => {
  const email = `${randomUUID()}@example.com`;
  const password = "Test1234!";

  const account = await request.post(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key",
    { data: { email, password, returnSecureToken: true } },
  );
  expect(account.ok()).toBeTruthy();

  await page.goto("/login");
  await page.getByPlaceholder("이메일", { exact: true }).fill(email);
  await page.getByPlaceholder("비밀번호", { exact: true }).fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();

  await expect(page).toHaveURL("http://127.0.0.1:3100/");
});

test("빈 입력 오류를 각 인풋에 연결해 표시한다", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "로그인", exact: true }).click();

  await expect(
    page.getByLabel("이메일", { exact: true }),
  ).toHaveAccessibleDescription("이메일을 입력해주세요.");
  await expect(
    page.getByLabel("비밀번호", { exact: true }),
  ).toHaveAccessibleDescription("비밀번호를 입력해주세요.");
  await expect(page.locator("#email-error")).toBeVisible();
  await expect(page.locator("#password-error")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("잘못된 이메일 형식이면 이메일 아래 오류를 표시한다", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("이메일", { exact: true }).fill("invalid-email");
  await page.getByLabel("비밀번호", { exact: true }).fill("Test1234!");
  await page.getByRole("button", { name: "로그인", exact: true }).click();

  await expect(page.locator("#email-error")).toHaveText(
    "올바른 이메일 형식이 아닙니다.",
  );
  await expect(page).toHaveURL(/\/login$/);
});

test("로그인 실패 오류를 비밀번호 아래 표시하고 재시도할 수 있다", async ({
  page,
  request,
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
  const passwordInput = page.getByLabel("비밀번호", { exact: true });
  await passwordInput.fill("Wrong1234!");
  await page.getByRole("button", { name: "로그인", exact: true }).click();

  await expect(passwordInput).toHaveAccessibleDescription(
    "로그인에 실패했습니다. 입력값과 연결 상태를 확인해주세요.",
  );
  await expect(page.locator("#password-error")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);

  await passwordInput.fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
});
