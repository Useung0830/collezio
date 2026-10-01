import { randomUUID } from "node:crypto";

import type { APIRequestContext, Page } from "@playwright/test";

import { expect, test as base } from "./fixtures";

const documentsUrl =
  "http://127.0.0.1:8080/v1/projects/demo-collezio/databases/(default)/documents";
const ownerHeaders = { Authorization: "Bearer owner" };
const chatImage = {
  name: "chat.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
    "base64",
  ),
};

const test = base.extend<{ productIds: string[] }>({
  productIds: async ({ request }, runWithProducts) => {
    const productIds: string[] = [];
    try {
      await runWithProducts(productIds);
    } finally {
      const responses = await Promise.all(
        productIds.map((productId) =>
          request.delete(`${documentsUrl}/products/${productId}`, {
            headers: ownerHeaders,
          }),
        ),
      );
      for (const response of responses) {
        expect(response.ok() || response.status() === 404).toBeTruthy();
      }
    }
  },
});

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
  productIds: string[],
  sellerId: string,
  type: "sale" | "exchange",
) {
  const productId = randomUUID();
  productIds.push(productId);
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

test("신고와 차단은 연결 실패 후 재시도할 수 있다", async ({
  page,
  request,
  productIds,
  context,
}) => {
  const requester = await createAccount(request, "재시도 신고자");
  const seller = await createAccount(request, "재시도 대상");
  const productId = await createProduct(
    request,
    productIds,
    seller.userId,
    "exchange",
  );
  await login(page, requester);
  await page.goto(`/products/${productId}`);
  await page.getByRole("button", { name: "채팅하기", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "채팅 더보기" }).click();
  await page.getByRole("button", { name: "신고하기", exact: true }).click();
  let dialog = page.getByRole("dialog", { name: "사용자 신고" });
  await dialog.getByLabel("스팸·광고", { exact: true }).check();
  await dialog.getByLabel("상세 내용 (선택)").fill("반복 광고 메시지");
  await page.screenshot({
    path: "test-results/chat-report-mobile.png",
    fullPage: true,
  });
  try {
    await context.setOffline(true);
    await dialog.getByRole("button", { name: "신고 제출" }).click();
    await expect(dialog.getByRole("alert")).toBeVisible({ timeout: 15000 });
    await expect(dialog.getByLabel("상세 내용 (선택)")).toHaveValue(
      "반복 광고 메시지",
    );
    await context.setOffline(false);
    await dialog.getByRole("button", { name: "신고 다시 시도" }).click();
    await expect(dialog.getByRole("status")).toContainText(
      "신고가 접수되었습니다.",
    );
    await dialog.getByRole("button", { name: "확인", exact: true }).click();
    await page.getByRole("button", { name: "차단하기", exact: true }).click();
    dialog = page.getByRole("dialog", { name: "상대방을 차단할까요?" });
    await page.screenshot({
      path: "test-results/chat-block-mobile.png",
      fullPage: true,
    });
    await context.setOffline(true);
    await dialog
      .getByRole("button", { name: "차단 확인", exact: true })
      .click();
    await expect(dialog.getByRole("alert")).toBeVisible({ timeout: 15000 });
    await context.setOffline(false);
    await dialog
      .getByRole("button", { name: "차단 확인", exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
    await expect(
      page.getByText("차단한 사용자입니다.", { exact: false }),
    ).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
  const reports = await request.get(
    `${documentsUrl}/users/${requester.userId}/chatReports`,
    { headers: ownerHeaders },
  );
  expect((await reports.json()).documents).toHaveLength(1);
});

test("차단은 다른 탭과 상대방에 반영되고 상호 차단을 모두 해제해야 전송된다", async ({
  page,
  request,
  productIds,
  browser,
}) => {
  const requester = await createAccount(request, "차단 신청자");
  const seller = await createAccount(request, "차단 판매자");
  const productId = await createProduct(
    request,
    productIds,
    seller.userId,
    "sale",
  );
  const secondProductId = await createProduct(
    request,
    productIds,
    seller.userId,
    "exchange",
  );
  const sellerContext = await browser.newContext({
    baseURL: "http://127.0.0.1:3100",
  });
  await sellerContext.route(
    /^https:\/\/(identitytoolkit|securetoken|firestore)\.googleapis\.com\//,
    (route) => route.abort(),
  );
  try {
    await login(page, requester);
    await page.goto(`/products/${productId}`);
    await page.getByRole("button", { name: "채팅하기", exact: true }).click();
    await page.getByLabel("메시지", { exact: true }).fill("차단 전 대화");
    await page.getByRole("button", { name: "메시지 전송" }).click();
    await expect(page.getByText("차단 전 대화", { exact: true })).toBeVisible();
    const roomUrl = page.url();
    const otherTab = await page.context().newPage();
    await otherTab.goto(roomUrl);
    const sellerPage = await sellerContext.newPage();
    await login(sellerPage, seller);
    await sellerPage.goto(roomUrl);
    await expect(
      sellerPage.getByLabel("메시지", { exact: true }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "채팅 더보기" }).click();
    await page.getByRole("button", { name: "차단하기", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "취소" })
      .click();
    await expect(page.getByLabel("메시지", { exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "차단하기", exact: true }).click();
    await page.getByRole("button", { name: "차단 확인", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      otherTab.getByText("차단한 사용자입니다.", { exact: false }),
    ).toBeVisible();
    await expect(
      sellerPage.getByText("메시지를 보낼 수 없는 대화입니다."),
    ).toBeVisible();
    await expect(sellerPage.getByLabel("메시지", { exact: true })).toHaveCount(
      0,
    );
    await expect(
      sellerPage.getByText("차단 전 대화", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText("차단한 사용자입니다.", { exact: false }),
    ).toBeVisible();
    await otherTab.goto(`/products/${secondProductId}`);
    await expect(
      otherTab.getByRole("button", { name: "채팅하기", exact: true }),
    ).toBeDisabled();
    await expect(
      otherTab.getByText("이 사용자와 새 대화를 시작할 수 없습니다.", {
        exact: false,
      }),
    ).toBeVisible();
    await sellerPage.getByRole("button", { name: "채팅 더보기" }).click();
    await sellerPage
      .getByRole("button", { name: "차단하기", exact: true })
      .click();
    await sellerPage
      .getByRole("button", { name: "차단 확인", exact: true })
      .click();
    await expect(sellerPage.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("button", { name: "차단 해제", exact: true }).click();
    await page
      .getByRole("button", { name: "차단 해제 확인", exact: true })
      .click();
    await expect(
      page.getByText("메시지를 보낼 수 없는 대화입니다."),
    ).toBeVisible();
    await sellerPage
      .getByRole("group", { name: "채팅 관리" })
      .getByRole("button", { name: "차단 해제", exact: true })
      .click();
    await sellerPage
      .getByRole("button", { name: "차단 해제 확인", exact: true })
      .click();
    await expect(page.getByLabel("메시지", { exact: true })).toBeEnabled();
    await expect(
      otherTab.getByRole("button", { name: "채팅하기", exact: true }),
    ).toBeEnabled();
    await page.getByLabel("메시지", { exact: true }).fill("해제 후 대화");
    await page.getByRole("button", { name: "메시지 전송" }).click();
    await expect(
      sellerPage.getByText("해제 후 대화", { exact: true }),
    ).toBeVisible();
    await otherTab.close();
  } finally {
    await sellerContext.close();
  }
});

test("채팅 상대 신고는 기타 내용 입력 후 접수되고 대화는 유지된다", async ({
  page,
  request,
  productIds,
}) => {
  const requester = await createAccount(request, "신고 신청자");
  const seller = await createAccount(request, "신고 판매자");
  const productId = await createProduct(
    request,
    productIds,
    seller.userId,
    "sale",
  );
  await login(page, requester);
  await page.goto(`/products/${productId}`);
  await page.getByRole("button", { name: "채팅하기", exact: true }).click();
  await page.getByRole("button", { name: "채팅 더보기" }).click();
  await page.getByRole("button", { name: "신고하기", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "사용자 신고" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("기타", { exact: true }).check();
  await expect(
    dialog.getByRole("button", { name: "신고 제출" }),
  ).toBeDisabled();
  await dialog
    .getByLabel("상세 내용 (필수)")
    .fill("상품 설명과 거래 조건이 다릅니다.");
  await dialog.getByRole("button", { name: "신고 제출" }).click();
  await expect(dialog.getByRole("status")).toContainText(
    "신고가 접수되었습니다.",
  );
  await dialog.getByRole("button", { name: "확인", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel("메시지", { exact: true })).toBeEnabled();
  const reports = await request.get(
    `${documentsUrl}/users/${requester.userId}/chatReports`,
    { headers: ownerHeaders },
  );
  const documents = (await reports.json()).documents;
  expect(documents).toHaveLength(1);
  expect(documents[0].fields.partnerId.stringValue).toBe(seller.userId);
});

test("채팅 목록에서 뒤로가면 채팅을 시작한 상품 상세로 돌아간다", async ({
  page,
  request,
  productIds,
}) => {
  const requester = await createAccount(request, "뒤로가기 신청자");
  const seller = await createAccount(request, "뒤로가기 판매자");
  const productId = await createProduct(
    request,
    productIds,
    seller.userId,
    "exchange",
  );
  const productUrl = `http://127.0.0.1:3100/products/${productId}`;

  await login(page, requester);
  await page.goto(productUrl);
  await page.getByRole("button", { name: "채팅하기", exact: true }).click();
  await expect(page).toHaveURL(/\/chat\/[A-Za-z0-9]{20}$/);
  await page.reload();
  await page
    .getByRole("link", { name: "채팅 목록으로 돌아가기", exact: true })
    .click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/chat");
  await page.getByRole("button", { name: "이전 페이지로 이동" }).click();
  await expect(page).toHaveURL(productUrl);

  await page.goForward();
  await expect(page).toHaveURL("http://127.0.0.1:3100/chat");
  await page.goBack();
  await expect(page).toHaveURL(productUrl);
});

test("상품별 채팅방 생성·재진입·내 목록 표시와 판매자 비공개", async ({
  page,
  request,
  productIds,
}) => {
  const requester = await createAccount(request, "채팅 신청자");
  const seller = await createAccount(request, "테스트 판매자");
  await login(page, requester);
  const roomUrls: string[] = [];
  for (const type of ["sale", "exchange"] as const) {
    const productId = await createProduct(
      request,
      productIds,
      seller.userId,
      type,
    );
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
    await expect(page.getByLabel("메시지", { exact: true })).toBeEnabled();
    await expect(
      page.getByRole("button", { name: "메시지 전송", exact: true }),
    ).toBeDisabled();
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

test("첫 전송 이후 상대방 목록에 나타나고 두 계정이 실시간으로 대화한다", async ({
  page,
  request,
  productIds,
  browser,
  context,
}) => {
  const requester = await createAccount(request, "대화 신청자");
  const seller = await createAccount(request, "대화 판매자");
  const productId = await createProduct(
    request,
    productIds,
    seller.userId,
    "sale",
  );
  const sellerContext = await browser.newContext({
    baseURL: "http://127.0.0.1:3100",
  });
  const blockedRequests: string[] = [];
  await sellerContext.route(
    /^https:\/\/(identitytoolkit|securetoken|firestore)\.googleapis\.com\//,
    async (route) => {
      blockedRequests.push(route.request().url());
      await route.abort();
    },
  );
  try {
    const sellerPage = await sellerContext.newPage();
    await login(sellerPage, seller);
    await sellerPage.goto("/chat");
    await expect(sellerPage.getByText("아직 채팅방이 없습니다.")).toBeVisible();
    await login(page, requester);
    await page.goto(`/products/${productId}`);
    await page.getByRole("button", { name: "채팅하기", exact: true }).click();
    await expect(page).toHaveURL(/\/chat\/[A-Za-z0-9]{20}$/);
    const roomUrl = page.url();
    const input = page.getByLabel("메시지", { exact: true });
    await expect(input).toBeEnabled();
    await expect(sellerPage.getByText("아직 채팅방이 없습니다.")).toBeVisible();

    await context.setOffline(true);
    await input.fill("안녕하세요. 상품 문의드립니다.");
    await page
      .getByRole("button", { name: "메시지 전송", exact: true })
      .click();
    await expect(
      page.getByText("인터넷 연결을 기다리고 있습니다. 연결되면 전송됩니다."),
    ).toBeVisible();
    await expect(sellerPage.getByText("아직 채팅방이 없습니다.")).toBeVisible();
    await context.setOffline(false);
    await expect(
      page.getByText("안녕하세요. 상품 문의드립니다.", { exact: true }),
    ).toBeVisible();
    await expect(input).toHaveValue("");
    const sellerRoom = sellerPage
      .getByRole("link")
      .filter({ hasText: "안녕하세요. 상품 문의드립니다." });
    await expect(sellerRoom).toBeVisible();
    await sellerRoom.click();
    await expect(sellerPage).toHaveURL(roomUrl);
    await expect(
      sellerPage.getByRole("heading", { name: "대화 신청자", exact: true }),
    ).toBeVisible();
    await expect(
      sellerPage.getByText("안녕하세요. 상품 문의드립니다.", { exact: true }),
    ).toBeVisible();
    await sellerPage
      .getByLabel("메시지", { exact: true })
      .fill("네, 문의 가능합니다.");
    await sellerPage
      .getByRole("button", { name: "메시지 전송", exact: true })
      .click();
    await expect(
      page.getByText("네, 문의 가능합니다.", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByLabel("대화 메시지").getByRole("listitem"),
    ).toHaveCount(2);
    await page.reload();
    await expect(
      page.getByText("네, 문의 가능합니다.", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "채팅 목록으로 돌아가기", exact: true })
      .click();
    await expect(
      page.getByText("네, 문의 가능합니다.", { exact: true }),
    ).toBeVisible();
    await sellerPage
      .getByLabel("메시지", { exact: true })
      .fill("추가 사진은 다음에 보내드릴게요.");
    await sellerPage
      .getByRole("button", { name: "메시지 전송", exact: true })
      .click();
    await expect(
      page.getByText("추가 사진은 다음에 보내드릴게요.", { exact: true }),
    ).toBeVisible();
    await page.goto(`/products/${productId}`);
    await expect(page.getByText("채팅 1", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "채팅하기", exact: true }).click();
    await expect(page).toHaveURL(roomUrl);
    await expect(
      page.getByLabel("대화 메시지").getByRole("listitem"),
    ).toHaveCount(3);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: "test-results/chat-messages-mobile.png",
      fullPage: true,
    });
    expect(blockedRequests).toEqual([]);
  } finally {
    await context.setOffline(false);
    await sellerContext.close();
  }
});

test("첫 전송 실패 시 입력을 보존하고 재시도 후 한 번만 저장한다", async ({
  page,
  request,
  productIds,
}) => {
  const requester = await createAccount(request, "재시도 신청자");
  const seller = await createAccount(request, "재시도 판매자");
  const productId = await createProduct(
    request,
    productIds,
    seller.userId,
    "exchange",
  );
  const productUrl = `${documentsUrl}/products/${productId}`;
  const originalProduct = await (
    await request.get(productUrl, { headers: ownerHeaders })
  ).json();
  await login(page, requester);
  await page.goto(`/products/${productId}`);
  await page.getByRole("button", { name: "채팅하기", exact: true }).click();
  await expect(page).toHaveURL(/\/chat\/[A-Za-z0-9]{20}$/);
  const roomId = new URL(page.url()).pathname.split("/").pop();
  const input = page.getByLabel("메시지", { exact: true });
  await expect(input).toBeEnabled();
  expect(
    (await request.delete(productUrl, { headers: ownerHeaders })).ok(),
  ).toBeTruthy();
  await input.fill("교환 가능할까요?");
  const sendButton = page.getByRole("button", {
    name: "메시지 전송",
    exact: true,
  });
  await sendButton.click();
  await expect(
    page.getByText(
      "메시지를 보내지 못했습니다. 내용을 확인하고 다시 보내주세요.",
    ),
  ).toBeVisible();
  await expect(input).toHaveValue("교환 가능할까요?");
  const room = await (
    await request.get(`${documentsUrl}/chatRooms/${roomId}`, {
      headers: ownerHeaders,
    })
  ).json();
  expect(room.fields.status.stringValue).toBe("draft");
  expect(room.fields.visibleTo.arrayValue.values).toEqual([
    { stringValue: requester.userId },
  ]);
  expect(
    (
      await request.patch(productUrl, {
        headers: ownerHeaders,
        data: { fields: originalProduct.fields },
      })
    ).ok(),
  ).toBeTruthy();
  await sendButton.click();
  await expect(
    page.getByText("교환 가능할까요?", { exact: true }),
  ).toBeVisible();
  await expect(input).toHaveValue("");
  await expect(
    page.getByLabel("대화 메시지").getByRole("listitem"),
  ).toHaveCount(1);
  await page.reload();
  await expect(
    page.getByLabel("대화 메시지").getByRole("listitem"),
  ).toHaveCount(1);
});

test("이미지 선택과 취소 후 이미지·텍스트가 순서대로 전달되고 스크롤바는 숨겨진다", async ({
  page,
  request,
  productIds,
  browser,
}) => {
  const buyer = await createAccount(request, "이미지 구매자");
  const seller = await createAccount(request, "이미지 판매자");
  const productId = await createProduct(
    request,
    productIds,
    seller.userId,
    "sale",
  );
  await login(page, buyer);
  await page.goto(`/products/${productId}`);
  await page.getByRole("button", { name: "채팅하기", exact: true }).click();
  await expect(page).toHaveURL(/\/chat\/[A-Za-z0-9]{20}$/);
  const roomUrl = page.url();
  const input = page.getByLabel("메시지", { exact: true });
  await expect(input).toBeEnabled();
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "사진 첨부", exact: true }).click();
  await (await chooserPromise).setFiles(chatImage);
  await expect(page.getByAltText("첨부 이미지 미리보기")).toBeVisible();
  await input.fill("선택 후에도 입력 가능");
  await page.getByRole("button", { name: "첨부 이미지 삭제" }).click();
  await expect(page.getByAltText("첨부 이미지 미리보기")).toHaveCount(0);
  await expect(input).toHaveValue("선택 후에도 입력 가능");
  await page.getByLabel("채팅 이미지 선택").setInputFiles({
    name: "invalid.gif",
    mimeType: "image/gif",
    buffer: Buffer.from("invalid"),
  });
  await expect(
    page.getByText("JPG, PNG, WebP 이미지만 첨부할 수 있습니다."),
  ).toBeVisible();
  await page.getByLabel("채팅 이미지 선택").setInputFiles(chatImage);
  await input.fill(
    Array.from({ length: 20 }, (_, i) => `여러 줄 ${i}`).join("\n"),
  );
  expect(
    await input.evaluate((element) => getComputedStyle(element).scrollbarWidth),
  ).toBe("none");
  expect(
    await input.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    ),
  ).toBeTruthy();
  await input.fill("사진과 함께 보내는 설명");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/chat-image-preview.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "메시지 전송" }).click();
  const items = page.getByLabel("대화 메시지").getByRole("listitem");
  await expect(items).toHaveCount(2);
  await expect(items.nth(0).getByAltText("채팅 이미지")).toBeVisible();
  await expect(items.nth(1)).toContainText("사진과 함께 보내는 설명");
  await expect(input).toHaveValue("");
  await expect(page.getByAltText("첨부 이미지 미리보기")).toHaveCount(0);
  expect(
    await items
      .nth(0)
      .getByAltText("채팅 이미지")
      .evaluate((image: HTMLImageElement) => image.naturalWidth),
  ).toBeGreaterThan(0);
  await page.reload();
  await expect(items.nth(0).getByAltText("채팅 이미지")).toBeVisible();
  await expect(items.nth(1)).toContainText("사진과 함께 보내는 설명");
  const sellerContext = await browser.newContext({
    baseURL: "http://127.0.0.1:3100",
  });
  try {
    const sellerPage = await sellerContext.newPage();
    await login(sellerPage, seller);
    await sellerPage.goto(roomUrl);
    await expect(sellerPage.getByAltText("채팅 이미지")).toBeVisible();
    await expect(
      sellerPage.getByText("사진과 함께 보내는 설명", { exact: true }),
    ).toBeVisible();
    await page.getByLabel("채팅 이미지 선택").setInputFiles(chatImage);
    await page.getByRole("button", { name: "메시지 전송" }).click();
    await expect(sellerPage.getByAltText("채팅 이미지")).toHaveCount(2);
    await page.screenshot({
      path: "test-results/chat-images-sent.png",
      fullPage: true,
    });
  } finally {
    await sellerContext.close();
  }
});

test("업로드 후 메시지 확정 실패 시 이미지와 입력을 보존하고 재시도한다", async ({
  page,
  request,
  productIds,
}) => {
  const buyer = await createAccount(request, "이미지 재시도 구매자");
  const seller = await createAccount(request, "이미지 재시도 판매자");
  const productId = await createProduct(
    request,
    productIds,
    seller.userId,
    "sale",
  );
  const productUrl = `${documentsUrl}/products/${productId}`;
  const original = await (
    await request.get(productUrl, { headers: ownerHeaders })
  ).json();
  await login(page, buyer);
  await page.goto(`/products/${productId}`);
  await page.getByRole("button", { name: "채팅하기", exact: true }).click();
  const input = page.getByLabel("메시지", { exact: true });
  await expect(input).toBeEnabled();
  await page.getByLabel("채팅 이미지 선택").setInputFiles(chatImage);
  await input.fill("재시도 설명");
  await request.delete(productUrl, { headers: ownerHeaders });
  await page.getByRole("button", { name: "메시지 전송" }).click();
  await expect(
    page.getByText(
      "메시지를 보내지 못했습니다. 내용을 확인하고 다시 보내주세요.",
    ),
  ).toBeVisible();
  await expect(input).toHaveValue("재시도 설명");
  await expect(page.getByAltText("첨부 이미지 미리보기")).toBeVisible();
  await expect(page.getByLabel("대화 메시지")).toHaveCount(0);
  await request.patch(productUrl, {
    headers: ownerHeaders,
    data: { fields: original.fields },
  });
  await page.getByRole("button", { name: "메시지 전송" }).click();
  await expect(
    page.getByLabel("대화 메시지").getByRole("listitem"),
  ).toHaveCount(2);
  await expect(page.getByAltText("채팅 이미지")).toBeVisible();
});

test("사진 묶음 10장과 상세 보기의 이동·저장·공유", async ({
  page,
  request,
  productIds,
}) => {
  const buyer = await createAccount(request, "묶음 구매자");
  const seller = await createAccount(request, "묶음 판매자");
  const productId = await createProduct(
    request,
    productIds,
    seller.userId,
    "sale",
  );
  await login(page, buyer);
  await page.goto(`/products/${productId}`);
  await page.getByRole("button", { name: "채팅하기", exact: true }).click();
  await expect(page.getByLabel("메시지", { exact: true })).toBeEnabled();
  const files = Array.from({ length: 10 }, (_, index) => ({
    ...chatImage,
    name: `photo-${index}.png`,
  }));
  await page.getByLabel("채팅 이미지 선택").setInputFiles([...files, files[0]]);
  await expect(
    page.getByText("사진은 최대 10장까지 선택할 수 있습니다."),
  ).toBeVisible();
  await expect(page.getByAltText("첨부 이미지 미리보기")).toHaveCount(0);
  await page.getByLabel("채팅 이미지 선택").setInputFiles(files);
  await expect(page.getByAltText("첨부 이미지 미리보기")).toHaveCount(10);
  await page.getByRole("button", { name: "첨부 이미지 삭제" }).nth(4).click();
  await expect(page.getByAltText("첨부 이미지 미리보기")).toHaveCount(9);
  await page.getByLabel("채팅 이미지 선택").setInputFiles(files[4]);
  await page.getByLabel("메시지", { exact: true }).fill("묶음 설명");
  await page.getByRole("button", { name: "메시지 전송" }).click();
  const items = page.getByLabel("대화 메시지").getByRole("listitem");
  await expect(items).toHaveCount(2);
  const album = page.getByRole("button", {
    name: "사진 10장 상세 보기",
    exact: true,
  });
  await expect(album.getByRole("img")).toHaveCount(10);
  await expect(items.nth(1)).toContainText("묶음 설명");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/chat-album-10.png" });
  await album.getByRole("img").last().click();
  const viewer = page.getByRole("dialog", { name: "사진 상세 보기" });
  await expect(viewer.getByText("1 / 10", { exact: true })).toBeVisible();
  await expect(
    viewer.getByRole("button", { name: "이전 사진", exact: true }),
  ).toBeDisabled();
  await viewer.getByRole("button", { name: "다음 사진", exact: true }).click();
  await expect(viewer.getByText("2 / 10", { exact: true })).toBeVisible();
  await viewer.press("ArrowLeft");
  await expect(viewer.getByText("1 / 10", { exact: true })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await viewer.getByRole("link", { name: "현재 사진 저장" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("chat-photo-1.png");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: () => false,
    });
  });
  await viewer.getByRole("button", { name: "공유", exact: true }).click();
  await expect(viewer.getByRole("status")).toContainText(
    "사진을 저장한 뒤 공유",
  );
  await page.evaluate(() => {
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: () => true,
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data: ShareData) => {
        document.documentElement.dataset.sharedPhoto = data.files?.[0]?.name;
      },
    });
  });
  await viewer.getByRole("button", { name: "공유", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-shared-photo",
    "chat-photo-1.png",
  );
  await viewer.press("Escape");
  await expect(viewer).toHaveCount(0);
  await album.click();
  await expect(viewer.getByText("1 / 10", { exact: true })).toBeVisible();
  await viewer.getByRole("button", { name: "사진 상세 닫기" }).click();
  await page.reload();
  await expect(album.getByRole("img")).toHaveCount(10);
  for (const count of [2, 3]) {
    await page
      .getByLabel("채팅 이미지 선택")
      .setInputFiles(files.slice(0, count));
    await page.getByRole("button", { name: "메시지 전송" }).click();
    const grid = page.getByRole("button", {
      name: `사진 ${count}장 상세 보기`,
      exact: true,
    });
    await expect(grid.getByRole("img")).toHaveCount(count);
    await page.screenshot({ path: `test-results/chat-album-${count}.png` });
  }
  await expect(items).toHaveCount(4);
});

test("구매 제안 작성·수락·변경 거절은 양쪽 채팅과 예약에 반영된다", async ({
  page,
  browser,
  request,
  productIds,
}) => {
  const buyer = await createAccount(request, "제안 구매자");
  const seller = await createAccount(request, "제안 판매자");
  const productId = await createProduct(
    request,
    productIds,
    seller.userId,
    "sale",
  );
  await login(page, buyer);
  await page.goto(`/products/${productId}`);
  await page.getByRole("button", { name: "채팅하기", exact: true }).click();
  await page.getByRole("button", { name: "구매 제안", exact: true }).click();
  const form = page.getByRole("dialog", { name: "구매 제안", exact: true });
  await form.getByLabel("거래 금액 (원)").fill("10000");
  await form.getByLabel("거래 방식").selectOption("direct");
  const tomorrow = new Date(Date.now() + 86400000);
  const date = new Date(
    tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 16);
  await form.getByLabel("약속 날짜·시간").fill(date);
  await form.getByLabel("거래 장소").fill("서울역 1번 출구");
  await form.getByLabel("추가 요청사항").fill("도착하면 알려주세요.");
  await form.getByRole("button", { name: "닫기", exact: true }).click();
  await page.getByRole("button", { name: "구매 제안", exact: true }).click();
  await expect(form.getByLabel("거래 금액 (원)")).toHaveValue("10000");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/trade-proposal-mobile.png" });
  await form.getByRole("button", { name: "제안 보내기" }).click();
  await expect(form).toHaveCount(0);
  await expect(page.getByText("구매 제안 · 응답 대기")).toBeVisible();
  const roomUrl = page.url();
  const sellerContext = await browser.newContext({
    baseURL: "http://127.0.0.1:3100",
  });
  try {
    const other = await sellerContext.newPage();
    await login(other, seller);
    await other.goto(roomUrl);
    await other
      .getByRole("button", { name: "제안 확인하기", exact: true })
      .click();
    await expect(
      other.getByText("거래 금액: 10,000원", { exact: true }),
    ).toBeVisible();
    await other.getByRole("button", { name: "수락", exact: true }).click();
    await expect(
      other.getByRole("dialog", { name: "약속 확정", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("구매 제안 · 약속 확정")).toBeVisible();
    const product = await (
      await request.get(`${documentsUrl}/products/${productId}`, {
        headers: ownerHeaders,
      })
    ).json();
    expect(product.fields.status.stringValue).toBe("reserved");
    await page.getByRole("button", { name: "조건 변경", exact: true }).click();
    await expect(form.getByLabel("거래 금액 (원)")).toHaveValue("10000");
    await form.getByLabel("거래 금액 (원)").fill("9000");
    await form.getByRole("button", { name: "제안 보내기" }).click();
    await expect(page.getByText("구매 제안 · 응답 대기")).toBeVisible();
    await other.getByRole("button", { name: "닫기", exact: true }).click();
    await expect(
      other.getByRole("button", { name: "제안 확인하기", exact: true }),
    ).toHaveCount(2);
    await other
      .getByRole("button", { name: "제안 확인하기", exact: true })
      .last()
      .click();
    await other.getByRole("button", { name: "거절", exact: true }).click();
    await expect(page.getByText("구매 제안 · 거절됨")).toBeVisible();
    await expect(page.getByText("구매 제안 · 약속 확정")).toBeVisible();
    await page.reload();
    await expect(page.getByText("구매 제안 · 약속 확정")).toBeVisible();
  } finally {
    await sellerContext.close();
  }
});

test("교환 제안은 내 상품을 선택하고 수락 후 새 상품으로 변경할 수 있다", async ({
  page,
  browser,
  request,
  productIds,
}) => {
  const buyer = await createAccount(request, "교환 신청자");
  const seller = await createAccount(request, "교환 등록자");
  const target = await createProduct(
    request,
    productIds,
    seller.userId,
    "exchange",
  );
  const first = await createProduct(request, productIds, buyer.userId, "sale");
  const second = await createProduct(
    request,
    productIds,
    buyer.userId,
    "exchange",
  );
  await login(page, buyer);
  await page.goto(`/products/${target}`);
  await page.getByRole("button", { name: "채팅하기", exact: true }).click();
  await page.getByRole("button", { name: "교환 제안", exact: true }).click();
  const form = page.getByRole("dialog", { name: "교환 제안", exact: true });
  await expect(form.getByRole("radio")).toHaveCount(2);
  await form.getByRole("radio", { name: /판매 채팅 테스트 상품/ }).check();
  const date = new Date(Date.now() + 172800000);
  await form
    .getByLabel("발송 예정 날짜·시간")
    .fill(
      new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16),
    );
  await form.getByLabel("추가금 (원)").fill("3000");
  await form.getByLabel("추가금 지급자").selectOption("seller");
  await form.getByRole("button", { name: "제안 보내기" }).click();
  await expect(form).toHaveCount(0);
  const roomUrl = page.url();
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:3100",
  });
  try {
    const other = await context.newPage();
    await login(other, seller);
    await other.goto(roomUrl);
    await other.getByRole("button", { name: "제안 확인하기" }).click();
    await expect(
      other.getByText("추가금: 3,000원 (상품 등록자 지급)"),
    ).toBeVisible();
    await other.getByRole("button", { name: "수락", exact: true }).click();
    await expect(page.getByText("교환 제안 · 약속 확정")).toBeVisible();
    await page.getByRole("button", { name: "조건 변경" }).click();
    await form.getByRole("radio", { name: /교환 채팅 테스트 상품/ }).check();
    await form.getByRole("button", { name: "제안 보내기" }).click();
    await expect(form).toHaveCount(0);
    await other.getByRole("button", { name: "닫기", exact: true }).click();
    await expect(
      other.getByRole("button", { name: "제안 확인하기" }),
    ).toHaveCount(2);
    await other.getByRole("button", { name: "제안 확인하기" }).last().click();
    await other.getByRole("button", { name: "수락", exact: true }).click();
    await expect(
      page.getByText("교환 제안 · 새 조건으로 변경됨"),
    ).toBeVisible();
    for (const [id, expected] of [
      [first, "available"],
      [second, "reserved"],
      [target, "reserved"],
    ]) {
      const data = await (
        await request.get(`${documentsUrl}/products/${id}`, {
          headers: ownerHeaders,
        })
      ).json();
      expect(data.fields.status.stringValue).toBe(expected);
    }
  } finally {
    await context.close();
  }
});

test("비로그인과 본인 상품에서는 채팅방 생성 제한", async ({
  page,
  request,
  productIds,
}) => {
  const seller = await createAccount(request, "본인 판매자");
  const productId = await createProduct(
    request,
    productIds,
    seller.userId,
    "sale",
  );
  await page.goto(`/products/${productId}`);
  const button = page.getByRole("button", { name: "채팅하기", exact: true });
  await expect(button).toBeEnabled();
  await button.click();
  await expect(
    page.getByText("로그인 후 채팅을 시작할 수 있습니다."),
  ).toBeVisible();
  await expect(page).toHaveURL(`http://127.0.0.1:3100/products/${productId}`);
  await page.goto("/chat");
  await expect(page).toHaveURL("http://127.0.0.1:3100/login");
  await login(page, seller);
  await page.goto(`/products/${productId}`);
  await expect(button).toBeDisabled();
  await expect(
    page.getByText("내 상품에는 채팅을 시작할 수 없습니다."),
  ).toBeVisible();
});
