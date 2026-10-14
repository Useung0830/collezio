import { randomUUID } from "node:crypto";

import type { APIRequestContext, Page } from "@playwright/test";

import { expect, test } from "./fixtures";

async function login(page: Page, request: APIRequestContext) {
  const email = `${randomUUID()}@example.com`;
  const password = "Test1234!";
  const response = await request.post(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key",
    { data: { email, password, returnSecureToken: true } },
  );
  expect(response.ok()).toBeTruthy();
  const account: unknown = await response.json();
  if (
    typeof account !== "object" ||
    account === null ||
    !("localId" in account) ||
    typeof account.localId !== "string" ||
    !account.localId
  ) {
    throw new Error("회원가입 응답에 유효한 사용자 ID가 없습니다.");
  }
  await page.goto("/login");
  await page.getByLabel("이메일", { exact: true }).fill(email);
  await page.getByLabel("비밀번호", { exact: true }).fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
  return account.localId;
}

test("취소는 로그인을 유지하고 확인은 다른 탭·새로고침·뒤로가기에도 반영된다", async ({
  page,
  request,
  context,
}) => {
  const userId = await login(page, request);
  const productId = randomUUID();
  const productUrl = `http://127.0.0.1:8080/v1/projects/demo-collezio/databases/(default)/documents/products/${productId}`;
  const headers = { Authorization: "Bearer owner" };
  try {
    const response = await request.patch(productUrl, {
      headers,
      data: {
        fields: {
          title: { stringValue: "로그아웃 검증 보유품" },
          sellerId: { stringValue: userId },
          transaction: {
            mapValue: {
              fields: {
                type: { stringValue: "sale" },
                price: { integerValue: "1000" },
              },
            },
          },
        },
      },
    });
    expect(response.ok()).toBeTruthy();
    await page.goto("/collections");
    const otherTab = await context.newPage();
    await otherTab.goto("/collections");
    await expect(
      otherTab
        .getByRole("main")
        .getByText("로그아웃 검증 보유품", { exact: true }),
    ).toBeVisible();
    const openButton = page.getByRole("button", {
      name: "로그아웃",
      exact: true,
    });
    const dialog = page.getByRole("dialog", { name: "로그아웃 하시겠습니까?" });
    await openButton.click();
    await expect(dialog.getByRole("button", { name: "취소" })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(
      dialog.getByRole("button", { name: "로그아웃", exact: true }),
    ).toBeFocused();
    await dialog.getByRole("button", { name: "취소" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(openButton).toBeFocused();
    await openButton.click();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await openButton.click();
    await page.mouse.click(5, 5);
    await expect(dialog).toHaveCount(0);
    await expect(
      page.getByRole("banner").getByRole("link", { name: "마이페이지" }),
    ).toBeVisible();
    await openButton.click();
    await dialog.getByRole("button", { name: "로그아웃", exact: true }).click();
    await expect(page).toHaveURL("http://127.0.0.1:3100/");
    await expect(
      page
        .getByRole("banner")
        .getByRole("link", { name: "로그인", exact: true }),
    ).toBeVisible();
    await expect(otherTab).toHaveURL("http://127.0.0.1:3100/");
    await expect(
      otherTab
        .getByRole("banner")
        .getByRole("link", { name: "로그인", exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page
        .getByRole("banner")
        .getByRole("link", { name: "로그인", exact: true }),
    ).toBeVisible();
    await page.goto("/favorites");
    await expect(page).toHaveURL("http://127.0.0.1:3100/login");
    await page.goto("/collections");
    await expect(page).toHaveURL("http://127.0.0.1:3100/login");
    await page.goBack();
    await expect(page).not.toHaveURL(/\/(collections|favorites)$/);
    await page.goForward();
    await expect(page).toHaveURL("http://127.0.0.1:3100/login");
    await login(page, request);
    await page.goto("/collections");
    await expect(
      page.getByRole("main").getByText("로그아웃 검증 보유품", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText("아직 등록한 상품이 없습니다. 첫 상품을 등록해보세요."),
    ).toBeVisible();
    await otherTab.close();
  } finally {
    expect((await request.delete(productUrl, { headers })).ok()).toBeTruthy();
  }
});

test("모바일 메뉴에서도 오프라인 로그아웃 후 메뉴가 닫힌다", async ({
  page,
  request,
  context,
}) => {
  await login(page, request);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "메뉴 열기" }).click();
  const menu = page.getByRole("complementary", { name: "전체 메뉴" });
  await menu.getByRole("button", { name: "로그아웃", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await context.setOffline(true);
  try {
    await dialog.getByRole("button", { name: "로그아웃", exact: true }).click();
    await expect(dialog).toHaveCount(0);
  } finally {
    await context.setOffline(false);
  }
  await page.getByRole("button", { name: "메뉴 열기" }).click();
  await expect(
    menu.getByRole("link", { name: "로그인", exact: true }),
  ).toBeVisible();
  await expect(
    menu.getByRole("button", { name: "로그아웃", exact: true }),
  ).toHaveCount(0);
});

test("저장소 실패는 오류를 표시하고 재시도 중 중복 실행과 모달 닫기를 막는다", async ({
  page,
  request,
}) => {
  await page.addInitScript(() => {
    const originalDelete = IDBObjectStore.prototype.delete;
    IDBObjectStore.prototype.delete = function (key) {
      if (
        this.name !== "firebaseLocalStorage" ||
        !String(key).startsWith("firebase:authUser:")
      ) {
        return originalDelete.call(this, key);
      }
      if (localStorage.getItem("logout-test-mode") === "fail") {
        throw new DOMException("테스트 인증 저장소 실패", "UnknownError");
      }
      const request = originalDelete.call(this, key);
      if (localStorage.getItem("logout-test-mode") === "pause") {
        request.addEventListener(
          "success",
          (event) => {
            event.stopImmediatePropagation();
            window.addEventListener(
              "logout-test-release",
              () => request.dispatchEvent(new Event("success")),
              { once: true },
            );
          },
          { once: true },
        );
      }
      return request;
    };
  });
  await login(page, request);
  await page.goto("/collections");
  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await page.evaluate(() => localStorage.setItem("logout-test-mode", "fail"));
  await dialog.getByRole("button", { name: "로그아웃", exact: true }).click();
  await expect(dialog.getByRole("alert")).toHaveText(
    "로그아웃하지 못했습니다. 다시 시도해주세요.",
  );
  await expect(page).toHaveURL(/\/collections$/);
  await page.evaluate(() => localStorage.setItem("logout-test-mode", "pause"));
  await dialog.getByRole("button", { name: "로그아웃", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "로그아웃 중" }),
  ).toBeDisabled();
  await expect(dialog.getByRole("button", { name: "취소" })).toBeDisabled();
  await page.keyboard.press("Escape");
  await page.mouse.click(5, 5);
  await expect(dialog).toBeVisible();
  await page.evaluate(() => {
    localStorage.removeItem("logout-test-mode");
    window.dispatchEvent(new Event("logout-test-release"));
  });
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("banner").getByRole("link", { name: "로그인", exact: true }),
  ).toBeVisible();
});
