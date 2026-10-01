import { expect, test } from "./fixtures";

for (const path of [
  "/collections",
  "/favorites",
  "/reviews",
  "/posts",
  "/chat",
  "/chat/unauthenticated-room",
]) {
  test(`비로그인 직접 접근은 로그인으로 이동한다: ${path}`, async ({
    page,
  }) => {
    await page.goto(path);
    await expect(page).toHaveURL("http://127.0.0.1:3100/login");
    await expect(page.getByLabel("이메일", { exact: true })).toBeVisible();
  });
}

test("홈에서 채팅 메뉴를 누르면 비로그인 사용자는 로그인으로 이동한다", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "채팅", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/login");
});
