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
