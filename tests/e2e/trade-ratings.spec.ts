import { randomUUID } from "node:crypto";

import type { APIRequestContext, Page } from "@playwright/test";

import { expect, test } from "./fixtures";

const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080";
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099";
const documentsUrl = `http://${firestoreHost}/v1/projects/demo-collezio/databases/(default)/documents`;
const headers = { Authorization: "Bearer owner" };

function encode(value: unknown): Record<string, unknown> {
  if (value === null) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "number") return { integerValue: String(value) };
  if (Array.isArray(value))
    return { arrayValue: { values: value.map(encode) } };
  if (value && typeof value === "object")
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value).map(([key, item]) => [key, encode(item)]),
        ),
      },
    };
  throw new Error("지원하지 않는 테스트 값입니다.");
}

async function seedDocument(
  request: APIRequestContext,
  path: string,
  data: Record<string, unknown>,
) {
  const response = await request.patch(`${documentsUrl}/${path}`, {
    headers,
    data: {
      fields: Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, encode(value)]),
      ),
    },
  });
  expect(response.ok()).toBeTruthy();
}

async function createAccount(request: APIRequestContext, nickname: string) {
  const email = `${randomUUID()}@example.com`,
    password = "Test1234!";
  const response = await request.post(
    `http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key`,
    { data: { email, password, returnSecureToken: true } },
  );
  expect(response.ok()).toBeTruthy();
  const { localId: userId } = await response.json();
  await seedDocument(request, `profiles/${userId}`, {
    nickname,
    imageUrl: null,
    bio: "",
    createdAt: new Date(),
  });
  return { userId: String(userId), email, password };
}

async function login(page: Page, account: { email: string; password: string }) {
  await page.goto("/login");
  await page.getByLabel("이메일", { exact: true }).fill(account.email);
  await page.getByLabel("비밀번호", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}

for (const kind of ["sale", "exchange"] as const) {
  test(`${kind}: 시간 경과 → 상호 완료 → 후기 모달 → 상호 제출 후 공개`, async ({
    page,
    context,
    browser,
    request,
    baseURL,
  }) => {
    const buyer = await createAccount(request, "구매자"),
      seller = await createAccount(request, "판매자");
    const roomId = randomUUID(),
      proposalId = randomUUID(),
      productId = randomUUID();
    const exchangeProductId = kind === "exchange" ? randomUUID() : null;
    const transaction =
      kind === "sale"
        ? { type: kind, price: 12000 }
        : { type: kind, desiredItemName: "교환 상품" };
    const product = {
      title: "후기 테스트 상품",
      description: "상호 후기 공개 확인",
      sellerId: seller.userId,
      status: "reserved",
      reservedByRoomId: roomId,
      transaction,
      delivery: { type: "parcel", shippingFee: 0 },
      images: [{ url: "https://example.com/item.png", path: "test/item" }],
      favoriteCount: 0,
      createdAt: new Date(),
    };
    await seedDocument(request, `products/${productId}`, product);
    if (exchangeProductId)
      await seedDocument(request, `products/${exchangeProductId}`, {
        ...product,
        sellerId: buyer.userId,
      });
    const terms = {
      kind,
      amount: kind === "sale" ? 12000 : 0,
      exchangeProductId,
      extraAmount: 0,
      extraPayer: "none",
      method: kind === "sale" ? "direct" : "parcel",
      scheduledAt: Date.now() + 120000,
      location: "서울역",
      shippingPayer: "each",
      notes: "",
    };
    const message = {
      content: "거래 제안",
      senderId: buyer.userId,
      proposalId,
      createdAt: new Date(),
    };
    const proposal = {
      senderId: buyer.userId,
      recipientId: seller.userId,
      productId,
      previousId: null,
      terms,
      status: "accepted",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await seedDocument(request, `chatRooms/${roomId}`, {
      productId,
      sellerId: seller.userId,
      requesterId: buyer.userId,
      visibleTo: [buyer.userId, seller.userId],
      status: "active",
      createdAt: new Date(),
      lastMessage: { id: proposalId, ...message },
    });
    await seedDocument(
      request,
      `chatRooms/${roomId}/messages/${proposalId}`,
      message,
    );
    await seedDocument(
      request,
      `chatRooms/${roomId}/proposals/${proposalId}`,
      proposal,
    );
    await seedDocument(request, `chatRooms/${roomId}/trade/state`, {
      acceptedId: proposalId,
      pendingId: null,
    });
    const partnerContext = await browser.newContext({ baseURL });
    await partnerContext.route(
      /^https:\/\/(identitytoolkit|securetoken|firestore|firebasestorage|storage)\.googleapis\.com\//,
      (route) => route.abort(),
    );
    const partnerPage = await partnerContext.newPage();
    try {
      await login(page, buyer);
      await login(partnerPage, seller);
      await page.goto(`/chat/${roomId}`);
      await partnerPage.goto(`/chat/${roomId}`);
      await expect(page.getByText("약속 확정", { exact: false })).toBeVisible();
      const notice = page.getByRole("listitem", { name: "거래 완료 안내" });
      await expect(notice).toHaveCount(0);
      await seedDocument(
        request,
        `chatRooms/${roomId}/proposals/${proposalId}`,
        { ...proposal, terms: { ...terms, scheduledAt: Date.now() + 2500 } },
      );
      const buyerLabel = kind === "sale" ? "구매 완료" : "교환 완료";
      const sellerLabel = kind === "sale" ? "판매 완료" : "교환 완료";
      await expect(
        notice.getByRole("button", { name: buyerLabel, exact: true }),
      ).toBeVisible({ timeout: 10000 });
      await notice
        .getByRole("button", { name: "아직이에요", exact: true })
        .click();
      await expect(
        notice.getByText("아직 거래 중이에요.", { exact: false }),
      ).toBeVisible();
      await page.reload();
      await expect(
        notice.getByText("아직 거래 중이에요.", { exact: false }),
      ).toBeVisible();
      await notice
        .getByRole("button", { name: buyerLabel, exact: true })
        .click();
      await expect(
        notice.getByText("상대방도 완료를 누르면", { exact: false }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "후기 남기기", exact: true }),
      ).toHaveCount(0);
      await partnerPage
        .getByRole("button", { name: sellerLabel, exact: true })
        .click();
      await expect(
        notice.getByRole("button", { name: "후기 남기기", exact: true }),
      ).toBeVisible();
      await page.setViewportSize({ width: 390, height: 844 });
      await notice
        .getByRole("button", { name: "후기 남기기", exact: true })
        .click();
      const dialog = page.getByRole("dialog", {
        name: "상대방에게 후기 남기기",
      });
      await dialog.getByRole("radio", { name: "4점" }).check();
      await dialog
        .getByLabel("거래 후기", { exact: true })
        .fill("친절하고 약속을 잘 지켜주셨어요.");
      await page.screenshot({
        path: `test-results/trade-review-${kind}-mobile.png`,
        fullPage: true,
      });
      await dialog
        .getByRole("button", { name: "후기 제출", exact: true })
        .click();
      await expect(dialog).toHaveCount(0);
      await expect(
        notice.getByText("후기를 제출했어요.", { exact: false }),
      ).toBeVisible();
      await expect(
        partnerPage.getByText("상대방이 후기를 남겼어요.", { exact: false }),
      ).toBeVisible();
      await expect(
        partnerPage.getByText("친절하고 약속을 잘 지켜주셨어요.", {
          exact: true,
        }),
      ).toHaveCount(0);
      await partnerPage.reload();
      await expect(
        partnerPage.getByText("친절하고 약속을 잘 지켜주셨어요.", {
          exact: true,
        }),
      ).toHaveCount(0);
      await partnerPage
        .getByRole("button", { name: "후기 남기기", exact: true })
        .click();
      const partnerDialog = partnerPage.getByRole("dialog", {
        name: "상대방에게 후기 남기기",
      });
      await partnerDialog.getByRole("radio", { name: "5점" }).check();
      await partnerDialog
        .getByLabel("거래 후기", { exact: true })
        .fill("좋은 거래 감사합니다.");
      await partnerDialog
        .getByRole("button", { name: "후기 제출", exact: true })
        .click();
      await expect(partnerDialog).toHaveCount(0);
      await expect(
        partnerPage.getByText("친절하고 약속을 잘 지켜주셨어요.", {
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByText("좋은 거래 감사합니다.", { exact: true }),
      ).toBeVisible();
      await context.setOffline(true);
      await expect(
        page.getByRole("button", { name: "후기 남기기", exact: true }),
      ).toHaveCount(0);
      await context.setOffline(false);
    } finally {
      await partnerContext.close();
    }
  });
}
