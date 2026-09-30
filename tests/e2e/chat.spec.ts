import { randomUUID } from "node:crypto";

import type { APIRequestContext, Page } from "@playwright/test";

import { expect, test } from "./fixtures";

const documentsUrl =
  "http://127.0.0.1:8080/v1/projects/demo-collezio/databases/(default)/documents";
const ownerHeaders = { Authorization: "Bearer owner" };

async function createAccount(request: APIRequestContext, nickname: string) {
  const email = `${randomUUID()}@example.com`;
  const password = "Test1234!";
  const response = await request.post(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key",
    { data: { email, password, returnSecureToken: true } },
  );
  expect(response.ok()).toBeTruthy();
  const account = await response.json();
  const userId: unknown = account.localId;
  if (typeof userId !== "string") throw new Error("계정 ID가 없습니다.");
  const profile = await request.patch(`${documentsUrl}/profiles/${userId}`, {
    headers: ownerHeaders,
    data: {
      fields: {
        nickname: { stringValue: nickname },
        imageUrl: { nullValue: null },
        bio: { stringValue: "" },
      },
    },
  });
  expect(profile.ok()).toBeTruthy();
  return { email, password, userId };
}

async function login(page: Page, account: { email: string; password: string }) {
  await page.goto("/login");
  await page.getByLabel("이메일", { exact: true }).fill(account.email);
  await page.getByLabel("비밀번호", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
}

async function createProduct(
  request: APIRequestContext,
  sellerId: string,
  type: "sale" | "exchange",
) {
  const productId = randomUUID();
  const response = await request.patch(
    `${documentsUrl}/products/${productId}`,
    {
      headers: ownerHeaders,
      data: {
        fields: {
          title: {
            stringValue: `${type === "sale" ? "판매" : "교환"} 채팅 테스트 상품`,
          },
          description: { stringValue: "채팅방 진입 테스트" },
          sellerId: { stringValue: sellerId },
          status: { stringValue: "available" },
          favoriteCount: { integerValue: "0" },
          transaction: {
            mapValue: {
              fields:
                type === "sale"
                  ? {
                      type: { stringValue: type },
                      price: { integerValue: "12000" },
                    }
                  : {
                      type: { stringValue: type },
                      desiredItemName: { stringValue: "고양이 키링" },
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
  return productId;
}

test("상품별 채팅방 생성·재진입·내 목록 표시와 판매자 비공개", async ({
  page,
  request,
}) => {
  const requester = await createAccount(request, "채팅 신청자");
  const seller = await createAccount(request, "테스트 판매자");
  await login(page, requester);
  const roomUrls: string[] = [];
  for (const type of ["sale", "exchange"] as const) {
    const productId = await createProduct(request, seller.userId, type);
    await page.goto(`/products/${productId}`);
    const button = page.getByRole("button", { name: "채팅하기", exact: true });
    await expect(button).toBeEnabled();
    await expect(button).toHaveClass(
      type === "sale" ? /bg-brand-blue/ : /bg-brand-green/,
    );
    await button.click();
    await expect(page).toHaveURL(/\/chat\/[A-Za-z0-9]{20}$/);
    const roomUrl = page.url();
    roomUrls.push(roomUrl);
    await expect(
      page.getByRole("heading", { name: "테스트 판매자", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("첫 메시지를 보내면 상대방의 채팅 목록에도 표시됩니다."),
    ).toBeVisible();
    await expect(page.getByLabel("메시지", { exact: true })).toBeDisabled();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "테스트 판매자", exact: true }),
    ).toBeVisible();
    await page.goto(`/products/${productId}`);
    await expect(page.getByText("채팅 0", { exact: true })).toBeVisible();
    await button.click();
    await expect(page).toHaveURL(roomUrl);
    const roomId = new URL(roomUrl).pathname.split("/").pop();
    const stored = await request.get(`${documentsUrl}/chatRooms/${roomId}`, {
      headers: ownerHeaders,
    });
    expect(stored.ok()).toBeTruthy();
    const data = (await stored.json()).fields;
    expect(data.status.stringValue).toBe("draft");
    expect(data.visibleTo.arrayValue.values).toEqual([
      { stringValue: requester.userId },
    ]);
  }
  expect(new Set(roomUrls).size).toBe(2);
  await page
    .getByRole("link", { name: "채팅 목록으로 돌아가기", exact: true })
    .click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/chat");
  await expect(page.getByText("아직 보낸 메시지가 없습니다.")).toHaveCount(2);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "채팅목록" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/chat-list-mobile.png",
    fullPage: true,
  });
  await page.goto(roomUrls[0]);
  await expect(
    page.getByRole("heading", { name: "테스트 판매자", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/chat-room-mobile.png",
    fullPage: true,
  });

  // 다른 탭의 계정 전환도 현재 채팅방에 반영하여 이전 신청자 캐시를 숨깁니다.
  const sellerPage = await page.context().newPage();
  await login(sellerPage, seller);
  await sellerPage.goto("/chat");
  await expect(sellerPage.getByText("아직 채팅방이 없습니다.")).toBeVisible();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "채팅방을 열 수 없습니다. 로그인 계정과 접근 권한을 확인해주세요.",
  );
  await expect(page.getByText("아직 시작하지 않은 대화입니다.")).toHaveCount(0);
  await sellerPage.close();
});

test("비로그인과 본인 상품에서는 채팅방 생성 제한", async ({
  page,
  request,
}) => {
  const seller = await createAccount(request, "본인 판매자");
  const productId = await createProduct(request, seller.userId, "sale");
  await page.goto(`/products/${productId}`);
  const button = page.getByRole("button", { name: "채팅하기", exact: true });
  await expect(button).toBeEnabled();
  await button.click();
  await expect(
    page.getByText("로그인 후 채팅을 시작할 수 있습니다."),
  ).toBeVisible();
  await expect(page).toHaveURL(`http://127.0.0.1:3100/products/${productId}`);
  await page.goto("/chat");
  await expect(
    page.getByText("로그인 후 채팅 목록을 확인할 수 있습니다."),
  ).toBeVisible();
  await login(page, seller);
  await page.goto(`/products/${productId}`);
  await expect(button).toBeDisabled();
  await expect(
    page.getByText("내 상품에는 채팅을 시작할 수 없습니다."),
  ).toBeVisible();
});
