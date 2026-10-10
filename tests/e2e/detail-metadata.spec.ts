import { randomUUID } from "node:crypto";

import { expect, test } from "./fixtures";

const documentsUrl =
  "http://127.0.0.1:8080/v1/projects/demo-collezio/databases/(default)/documents";

for (const collection of ["products", "communityPosts"] as const) {
  test(`${collection}: 상세별 메타데이터, 수정 반영, 삭제 시 검색 제외`, async ({
    page,
    request,
  }) => {
    const ids = [randomUUID(), randomUUID()];
    const route = collection === "products" ? "products" : "community";
    const contentField = collection === "products" ? "description" : "content";
    const timestamp = new Date().toISOString();
    try {
      for (const [index, id] of ids.entries()) {
        const response = await request.patch(
          `${documentsUrl}/${collection}/${id}`,
          {
            headers: { Authorization: "Bearer owner" },
            data: {
              fields: {
                title: { stringValue: `메타데이터 "검증" <${index}>` },
                [contentField]: {
                  stringValue: `본문 ${index}\n${"가".repeat(200)}`,
                },
                authorId: { stringValue: "metadata-author" },
                sellerId: { stringValue: "metadata-author" },
                images: { arrayValue: { values: [] } },
                status: { stringValue: "available" },
                transaction: {
                  mapValue: {
                    fields: {
                      type: { stringValue: "sale" },
                      price: { integerValue: "1000" },
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
                createdAt: { timestampValue: timestamp },
                updatedAt: { timestampValue: timestamp },
                likeCount: { integerValue: "0" },
                viewCount: { integerValue: "0" },
              },
            },
          },
        );
        expect(response.ok()).toBeTruthy();
        const htmlResponse = await request.get(`/${route}/${id}`, {
          headers: { "User-Agent": "Twitterbot/1.0" },
        });
        expect(htmlResponse.ok()).toBeTruthy();
        const html = await htmlResponse.text();
        const head = html.split("</head>")[0];
        expect(head).toContain(
          `<title>메타데이터 &quot;검증&quot; &lt;${index}&gt; | Collezio</title>`,
        );
        expect(head).toContain(`content="본문 ${index} ${"가".repeat(154)}…"`);
        expect(head).not.toContain('content="noindex"');
        await page.goto(`/${route}/${id}`);
        await expect(page).toHaveTitle(
          `메타데이터 "검증" <${index}> | Collezio`,
        );
        await expect(page.locator('meta[name="description"]')).toHaveAttribute(
          "content",
          `본문 ${index} ${"가".repeat(154)}…`,
        );
      }

      const updated = await request.patch(
        `${documentsUrl}/${collection}/${ids[0]}?updateMask.fieldPaths=title`,
        {
          headers: { Authorization: "Bearer owner" },
          data: { fields: { title: { stringValue: "수정된 제목" } } },
        },
      );
      expect(updated.ok()).toBeTruthy();
      await page.goto(`/${route}/${ids[0]}`);
      await expect(page).toHaveTitle("수정된 제목 | Collezio");

      const deleted = await request.delete(
        `${documentsUrl}/${collection}/${ids[0]}`,
        {
          headers: { Authorization: "Bearer owner" },
        },
      );
      expect(deleted.ok()).toBeTruthy();
      await page.reload();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        "noindex",
      );
      await expect(page).toHaveTitle(
        collection === "products"
          ? "상품 상세 | Collezio"
          : "커뮤니티 게시글 | Collezio",
      );
    } finally {
      for (const id of ids) {
        await request.delete(`${documentsUrl}/${collection}/${id}`, {
          headers: { Authorization: "Bearer owner" },
        });
      }
    }
  });
}
