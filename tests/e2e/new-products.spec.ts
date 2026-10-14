import { randomUUID } from "node:crypto";

import { expect, test } from "./fixtures";

test("비로그인 홈 NEW에서 전체 판매자의 상품을 최신순으로 더보기한다", async ({
  page,
  request,
}) => {
  const documentsUrl =
    "http://127.0.0.1:8080/v1/projects/demo-collezio/databases/(default)/documents/products";
  const productIds = Array.from({ length: 12 }, () => randomUUID());

  await page.goto("/");
  const newest = page.getByRole("region", { name: "NEW", exact: true });
  await expect(newest.getByText("아직 등록된 상품이 없습니다.")).toBeVisible();

  try {
    for (const [index, productId] of productIds.entries()) {
      const response = await request.patch(`${documentsUrl}/${productId}`, {
        headers: { Authorization: "Bearer owner" },
        data: {
          fields: {
            title: { stringValue: `최신순 상품 ${index}` },
            sellerId: { stringValue: `seller-${index % 2}` },
            status: {
              stringValue: ["available", "reserved", "completed"][index % 3],
            },
            createdAt: {
              timestampValue: new Date(
                Date.UTC(2026, 8, index + 1),
              ).toISOString(),
            },
            transaction: {
              mapValue: {
                fields: {
                  type: { stringValue: "sale" },
                  price: { integerValue: "12000" },
                },
              },
            },
            images: { arrayValue: { values: [] } },
          },
        },
      });
      expect(response.ok()).toBeTruthy();
    }

    await page.reload();
    const titles = newest.getByRole("heading", { level: 3 });
    await expect(titles).toHaveText(
      Array.from({ length: 10 }, (_, index) => `최신순 상품 ${11 - index}`),
    );
    await expect(newest.getByRole("link").first()).toHaveAttribute(
      "href",
      `/products/${productIds[11]}`,
    );
    await newest.getByRole("button", { name: "더보기" }).click();
    await expect(titles).toHaveText(
      Array.from({ length: 12 }, (_, index) => `최신순 상품 ${11 - index}`),
    );
    await expect(newest.getByRole("button", { name: "더보기" })).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
  } finally {
    for (const productId of productIds) {
      await request.delete(`${documentsUrl}/${productId}`, {
        headers: { Authorization: "Bearer owner" },
      });
    }
  }
});
