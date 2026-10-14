import { randomUUID } from "node:crypto";

import { expect, test as base } from "./fixtures";

const documentsUrl =
  "http://127.0.0.1:8080/v1/projects/demo-collezio/databases/(default)/documents/products";
const ownerHeaders = { Authorization: "Bearer owner" };

const test = base.extend<{ productIds: string[] }>({
  productIds: async ({ request }, runWithProducts) => {
    const productIds = Array.from({ length: 6 }, () => randomUUID());
    try {
      await runWithProducts(productIds);
    } finally {
      for (const id of productIds) {
        await request.delete(`${documentsUrl}/${id}`, {
          headers: ownerHeaders,
        });
      }
    }
  },
});

test("비로그인 인기상품은 빈 목록과 실제 상품 상위 4개를 찜 수·최신순으로 표시한다", async ({
  page,
  request,
  productIds,
}) => {
  await page.goto("/");
  const popular = page.getByRole("region", { name: "인기상품", exact: true });
  await expect(popular.getByText("아직 등록된 상품이 없습니다.")).toBeVisible();

  const counts = [2, 20, 5, 5, 10, 0];
  for (const [index, id] of productIds.entries()) {
    const response = await request.patch(`${documentsUrl}/${id}`, {
      headers: ownerHeaders,
      data: {
        fields: {
          title: { stringValue: `인기순 상품 ${index}` },
          favoriteCount: { integerValue: String(counts[index]) },
          createdAt: {
            timestampValue: new Date(
              Date.UTC(2026, 8, index + 1),
            ).toISOString(),
          },
          status: {
            stringValue: ["available", "reserved", "completed"][index % 3],
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
  await expect(popular.getByRole("heading", { level: 3 })).toHaveText([
    "인기순 상품 1",
    "인기순 상품 4",
    "인기순 상품 3",
    "인기순 상품 2",
  ]);
  await expect(popular.getByRole("link").first()).toHaveAttribute(
    "href",
    `/products/${productIds[1]}`,
  );
  await expect(
    popular.getByRole("article").first().getByText("20", { exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});

test("찜 수가 없는 기존 상품도 표시하고 잘못된 데이터 오류 후 재시도한다", async ({
  page,
  request,
  productIds,
}) => {
  const productUrl = `${documentsUrl}/${productIds[0]}`;
  const response = await request.patch(productUrl, {
    headers: ownerHeaders,
    data: {
      fields: {
        title: { stringValue: "기존 상품" },
        transaction: {
          mapValue: {
            fields: {
              type: { stringValue: "exchange" },
              desiredItemName: { stringValue: "교환할 피규어" },
            },
          },
        },
      },
    },
  });
  expect(response.ok()).toBeTruthy();
  await page.goto("/");
  const popular = page.getByRole("region", { name: "인기상품", exact: true });
  await expect(popular.getByRole("heading", { level: 3 })).toHaveText([
    "기존 상품",
  ]);
  await expect(popular.getByText("교환할 피규어")).toBeVisible();
  await expect(
    popular.getByRole("img", { name: "상품 사진 없음" }),
  ).toBeVisible();
  const invalid = await request.patch(
    `${productUrl}?updateMask.fieldPaths=title`,
    {
      headers: ownerHeaders,
      data: { fields: { title: { stringValue: "" } } },
    },
  );
  expect(invalid.ok()).toBeTruthy();
  await page.reload();
  await expect(popular.getByRole("alert")).toBeVisible();
  const restored = await request.patch(
    `${productUrl}?updateMask.fieldPaths=title`,
    {
      headers: ownerHeaders,
      data: { fields: { title: { stringValue: "기존 상품" } } },
    },
  );
  expect(restored.ok()).toBeTruthy();
  await popular.getByRole("button", { name: "다시 시도" }).click();
  await expect(popular.getByRole("heading", { level: 3 })).toHaveText([
    "기존 상품",
  ]);
  await expect(popular.getByRole("alert")).toHaveCount(0);
});
