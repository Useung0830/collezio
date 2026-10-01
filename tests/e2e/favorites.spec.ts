import { randomUUID } from "node:crypto";

import type { APIRequestContext, Page } from "@playwright/test";

import { expect, test as base } from "./fixtures";

const documentsUrl =
  "http://127.0.0.1:8080/v1/projects/demo-collezio/databases/(default)/documents";
const ownerHeaders = { Authorization: "Bearer owner" };

const test = base.extend<{ productId: string }>({
  productId: async ({ request }, runWithProduct) => {
    const productId = randomUUID();
    const response = await request.patch(
      `${documentsUrl}/products/${productId}`,
      {
        headers: ownerHeaders,
        data: {
          fields: {
            title: { stringValue: "찜 테스트 상품" },
            description: { stringValue: "찜 저장과 취소 확인" },
            status: { stringValue: "available" },
            favoriteCount: { integerValue: "0" },
            transaction: {
              mapValue: {
                fields: {
                  type: { stringValue: "sale" },
                  price: { integerValue: "12000" },
                },
              },
            },
            delivery: {
              mapValue: {
                fields: {
                  type: { stringValue: "parcel" },
                  shippingFee: { integerValue: "0" },
                },
              },
            },
            images: { arrayValue: { values: [] } },
          },
        },
      },
    );
    expect(response.ok()).toBeTruthy();
    try {
      await runWithProduct(productId);
    } finally {
      await request.delete(`${documentsUrl}/products/${productId}`, {
        headers: ownerHeaders,
      });
    }
  },
});

async function login(page: Page, request: APIRequestContext) {
  const email = `${randomUUID()}@example.com`;
  const password = "Test1234!";
  const response = await request.post(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key",
    { data: { email, password, returnSecureToken: true } },
  );
  expect(response.ok()).toBeTruthy();
  const account = await response.json();
  const profileResponse = await request.post(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-api-key",
    { data: { idToken: account.idToken, displayName: "찜 테스트 사용자" } },
  );
  expect(profileResponse.ok()).toBeTruthy();
  await page.goto("/login");
  await page.getByLabel("이메일", { exact: true }).fill(email);
  await page.getByLabel("비밀번호", { exact: true }).fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
  const userId: unknown = account.localId;
  if (typeof userId !== "string") throw new Error("테스트 계정 ID가 없습니다.");
  return userId;
}

async function addFavorite(page: Page, productId: string) {
  await page.goto(`/products/${productId}`);
  const button = page.getByRole("button", { name: "찜", exact: true });
  await expect(button).toBeEnabled();
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(button).toBeEnabled();
}

test("홈에서 상세로 이동해 찜을 추가·취소하면 인기상품 순위가 갱신된다", async ({
  page,
  request,
  productId,
}) => {
  const competitorId = randomUUID();
  const competitorUrl = `${documentsUrl}/products/${competitorId}`;
  const response = await request.patch(competitorUrl, {
    headers: ownerHeaders,
    data: {
      fields: {
        title: { stringValue: "최신 경쟁 상품" },
        favoriteCount: { integerValue: "0" },
        createdAt: { timestampValue: "2026-10-01T00:00:00Z" },
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
  try {
    await login(page, request);
    const popular = page.getByRole("region", { name: "인기상품", exact: true });
    const titles = popular.getByRole("heading", { level: 3 });
    await expect(titles).toHaveText(["최신 경쟁 상품", "찜 테스트 상품"]);
    await popular
      .getByRole("link")
      .filter({ hasText: "찜 테스트 상품" })
      .click();
    await expect(page).toHaveURL(`http://127.0.0.1:3100/products/${productId}`);
    const button = page.getByRole("button", { name: "찜", exact: true });
    await expect(button).toBeEnabled();
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(button).toBeEnabled();
    await page.getByRole("link", { name: "콜레지오 로고" }).click();
    await expect(titles).toHaveText(["찜 테스트 상품", "최신 경쟁 상품"]);
    await expect(
      popular.getByRole("article").first().getByText("1", { exact: true }),
    ).toBeVisible();
    await popular.getByRole("link").first().click();
    await expect(button).toBeEnabled();
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await expect(button).toBeEnabled();
    await page.getByRole("link", { name: "콜레지오 로고" }).click();
    await expect(titles).toHaveText(["최신 경쟁 상품", "찜 테스트 상품"]);
  } finally {
    await request.delete(competitorUrl, { headers: ownerHeaders });
  }
});

test("비로그인 찜 클릭은 로그인 안내를 표시하고 카운트를 유지한다", async ({
  page,
  productId,
}) => {
  await page.goto(`/products/${productId}`);
  const button = page.getByRole("button", { name: "찜", exact: true });
  await expect(button).toBeEnabled();
  await button.click();
  await expect(
    page.getByText("로그인 후 상품을 찜할 수 있습니다."),
  ).toBeVisible();
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByText("찜 0", { exact: true })).toBeVisible();
  await expect(
    page
      .getByRole("article")
      .getByRole("link", { name: "로그인", exact: true }),
  ).toHaveAttribute("href", "/login");
});

test("찜 저장·새로고침·취소가 화면과 DB에 반영된다", async ({
  page,
  request,
  productId,
}) => {
  const userId = await login(page, request);
  await page.goto(`/products/${productId}`);
  const button = page.getByRole("button", { name: "찜", exact: true });
  await expect(button).toBeEnabled();
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("찜 1", { exact: true })).toBeVisible();
  await expect(button).toBeEnabled();
  const favoriteUrl = `${documentsUrl}/users/${userId}/favorites/${productId}`;
  expect(
    (await request.get(favoriteUrl, { headers: ownerHeaders })).ok(),
  ).toBeTruthy();

  await page.reload();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("찜 1", { exact: true })).toBeVisible();
  await expect(button).toBeEnabled();
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByText("찜 0", { exact: true })).toBeVisible();
  await expect(button).toBeEnabled();
  expect(
    (await request.get(favoriteUrl, { headers: ownerHeaders })).status(),
  ).toBe(404);
  const storedProduct = await request.get(
    `${documentsUrl}/products/${productId}`,
    { headers: ownerHeaders },
  );
  expect((await storedProduct.json()).fields.favoriteCount.integerValue).toBe(
    "0",
  );
  await page.reload();
  await expect(button).toBeEnabled();
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByText("찜 0", { exact: true })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(button).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/favorite-mobile.png",
    fullPage: true,
  });
});

test("저장 거부 시 선택과 카운트를 유지하고 다시 시도할 수 있다", async ({
  page,
  request,
  productId,
}) => {
  await login(page, request);
  await page.goto(`/products/${productId}`);
  const button = page.getByRole("button", { name: "찜", exact: true });
  await expect(button).toBeEnabled();
  const commitPattern = "**/documents:commit*";
  await page.route(commitPattern, (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "http://127.0.0.1:3100",
        "Access-Control-Allow-Credentials": "true",
      },
      body: JSON.stringify({
        error: {
          code: 403,
          status: "PERMISSION_DENIED",
          message: "Test denied",
        },
      }),
    }),
  );
  await button.click();
  await expect(page.getByRole("article").getByRole("alert")).toHaveText(
    "찜 변경에 실패했습니다. 연결 상태를 확인한 뒤 다시 시도해주세요.",
  );
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByText("찜 0", { exact: true })).toBeVisible();
  await expect(button).toBeEnabled();
  await page.unroute(commitPattern);
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("찜 1", { exact: true })).toBeVisible();
  await expect(page.getByRole("article").getByRole("alert")).toHaveCount(0);
});

test("오프라인 요청은 중복 클릭을 막고 연결 복구 후 저장한다", async ({
  page,
  context,
  request,
  productId,
}) => {
  await login(page, request);
  await page.goto(`/products/${productId}`);
  const button = page.getByRole("button", { name: "찜", exact: true });
  await expect(button).toBeEnabled();
  try {
    await context.setOffline(true);
    await button.click();
    await expect(button).toBeDisabled();
    await expect(
      page.getByText("인터넷 연결을 기다리고 있습니다."),
    ).toBeVisible();
    await expect(page.getByText("찜 0", { exact: true })).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("찜 1", { exact: true })).toBeVisible();
  await expect(button).toBeEnabled();
});

test("비로그인 찜 목록은 목업 대신 로그인 안내를 표시한다", async ({
  page,
}) => {
  await page.goto("/favorites");
  const favorites = page.getByRole("region", { name: /찜한 컬렉션/ });
  await expect(
    favorites.getByText("로그인하면 찜한 상품을 확인할 수 있습니다."),
  ).toBeVisible();
  await expect(favorites.getByRole("heading", { level: 3 })).toHaveCount(0);
  await expect(favorites.getByRole("link", { name: "로그인" })).toHaveAttribute(
    "href",
    "/login",
  );
});

test("상세에서 찜한 상품을 목록에서 열고 취소 후 뒤로 가면 목록에서 사라진다", async ({
  page,
  request,
  productId,
}) => {
  await login(page, request);
  await page.goto("/favorites");
  const favorites = page.getByRole("region", { name: /찜한 컬렉션/ });
  await expect(favorites.getByText("아직 찜한 상품이 없습니다.")).toBeVisible();
  await page.goto(`/products/${productId}`);
  const button = page.getByRole("button", { name: "찜", exact: true });
  await expect(button).toBeEnabled();
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(button).toBeEnabled();
  await page.goto("/favorites");
  await expect(favorites.getByRole("heading", { level: 2 })).toHaveText(
    "찜한 컬렉션1",
  );
  await expect(favorites.getByRole("heading", { level: 3 })).toHaveText([
    "찜 테스트 상품",
  ]);
  await page.reload();
  await expect(favorites.getByRole("heading", { level: 3 })).toHaveText([
    "찜 테스트 상품",
  ]);
  await favorites.getByRole("link").click();
  await expect(page).toHaveURL(new RegExp(`/products/${productId}$`));
  await expect(button).toBeEnabled();
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(button).toBeEnabled();
  await page.goBack();
  await expect(favorites.getByText("아직 찜한 상품이 없습니다.")).toBeVisible();
  await expect(favorites.getByRole("heading", { level: 2 })).toHaveText(
    "찜한 컬렉션0",
  );
});

test("다른 탭에서 계정을 바꾸면 이전 사용자의 찜 목록과 선택 상태를 지운다", async ({
  page,
  context,
  request,
  productId,
}) => {
  const firstUserId = await login(page, request);
  await addFavorite(page, productId);
  await page.goto("/favorites");
  const favorites = page.getByRole("region", { name: /찜한 컬렉션/ });
  await expect(favorites.getByRole("heading", { level: 3 })).toHaveText([
    "찜 테스트 상품",
  ]);
  const secondPage = await context.newPage();
  try {
    await login(secondPage, request);
    await expect(
      favorites.getByText("아직 찜한 상품이 없습니다."),
    ).toBeVisible();
    await expect(favorites.getByRole("heading", { level: 3 })).toHaveCount(0);
    await page.goto(`/products/${productId}`);
    const button = page.getByRole("button", { name: "찜", exact: true });
    await expect(button).toBeEnabled();
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByText("찜 1", { exact: true })).toBeVisible();
    await button.click();
    await expect(page.getByText("찜 2", { exact: true })).toBeVisible();
    await expect(button).toBeEnabled();
    await button.click();
    await expect(page.getByText("찜 1", { exact: true })).toBeVisible();
    const firstFavorite = await request.get(
      `${documentsUrl}/users/${firstUserId}/favorites/${productId}`,
      { headers: ownerHeaders },
    );
    expect(firstFavorite.ok()).toBeTruthy();
  } finally {
    await secondPage.close();
  }
});

test("삭제된 상품은 찜 목록과 표시 개수에서 제외한다", async ({
  page,
  request,
  productId,
}) => {
  await login(page, request);
  await addFavorite(page, productId);
  const response = await request.delete(
    `${documentsUrl}/products/${productId}`,
    { headers: ownerHeaders },
  );
  expect(response.ok()).toBeTruthy();
  await page.goto("/favorites");
  const favorites = page.getByRole("region", { name: /찜한 컬렉션/ });
  await expect(favorites.getByText("아직 찜한 상품이 없습니다.")).toBeVisible();
  await expect(favorites.getByRole("heading", { level: 2 })).toHaveText(
    "찜한 컬렉션0",
  );
});

test("목록 조회 오류를 표시하고 재시도해 복구한다", async ({
  page,
  request,
  productId,
}) => {
  await login(page, request);
  await addFavorite(page, productId);
  const productUrl = `${documentsUrl}/products/${productId}?updateMask.fieldPaths=title`;
  const invalid = await request.patch(productUrl, {
    headers: ownerHeaders,
    data: { fields: { title: { stringValue: "" } } },
  });
  expect(invalid.ok()).toBeTruthy();
  await page.goto("/favorites");
  const favorites = page.getByRole("region", { name: /찜한 컬렉션/ });
  await expect(favorites.getByRole("alert")).toHaveText(
    "찜한 상품을 불러오지 못했습니다. 다시 시도해주세요.",
  );
  const restored = await request.patch(productUrl, {
    headers: ownerHeaders,
    data: { fields: { title: { stringValue: "찜 테스트 상품" } } },
  });
  expect(restored.ok()).toBeTruthy();
  await favorites.getByRole("button", { name: "다시 시도" }).click();
  await expect(favorites.getByRole("heading", { level: 3 })).toHaveText([
    "찜 테스트 상품",
  ]);
  await expect(favorites.getByRole("alert")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/favorites-list-mobile.png",
    fullPage: true,
  });
});
