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
    const bucket = "demo-collezio.appspot.com";
    const storageBase = `http://127.0.0.1:9199/v0/b/${bucket}/o`;
    const imagePath =
      collection === "products"
        ? `products/metadata-author/${randomUUID()}`
        : `community/metadata-author/${ids[1]}/${randomUUID()}`;
    const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(imagePath)}?alt=media`;
    // 상품 이미지 최적화 서버가 demo 버킷의 운영 주소로 요청하지 않도록 합니다.
    await page.route("**/_next/image?**", (route) => route.abort());
    try {
      const upload = await request.post(
        `${storageBase}?uploadType=media&name=${encodeURIComponent(imagePath)}`,
        {
          headers: {
            Authorization: "Bearer owner",
            "Content-Type": "image/png",
          },
          data: Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf1sAAAAASUVORK5CYII=",
            "base64",
          ),
        },
      );
      expect(upload.ok()).toBeTruthy();
      const anonymousImage = await request.get(
        `${storageBase}/${encodeURIComponent(imagePath)}?alt=media`,
      );
      expect(anonymousImage.ok()).toBeTruthy();
      expect(anonymousImage.headers()["content-type"]).toContain("image/png");
      const defaultImage = await request.get("/share-default.jpg");
      expect(defaultImage.ok()).toBeTruthy();
      expect(defaultImage.headers()["content-type"]).toContain("image/jpeg");
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
                images: {
                  arrayValue: {
                    values:
                      index === 0
                        ? []
                        : [
                            {
                              mapValue: {
                                fields: {
                                  path: { stringValue: imagePath },
                                  url: { stringValue: imageUrl },
                                },
                              },
                            },
                          ],
                  },
                },
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
        const htmlResponse = await request.get(
          `/${route}/${id}?utm_source=share`,
          {
            headers: { "User-Agent": "Twitterbot/1.0" },
          },
        );
        expect(htmlResponse.ok()).toBeTruthy();
        const html = await htmlResponse.text();
        const head = html.split("</head>")[0];
        expect(head).toContain(
          `<title>메타데이터 &quot;검증&quot; &lt;${index}&gt; | Collezio</title>`,
        );
        expect(head).toContain(`content="본문 ${index} ${"가".repeat(154)}…"`);
        expect(head).not.toContain('content="noindex"');
        const canonical = `http://127.0.0.1:3100/${route}/${id}`;
        const expectedImage =
          index === 0 ? "http://127.0.0.1:3100/share-default.jpg" : imageUrl;
        expect(head).toContain(`<link rel="canonical" href="${canonical}"`);
        expect(head).toContain(
          `<meta property="og:url" content="${canonical}"`,
        );
        expect(head).toContain(
          `<meta property="og:type" content="${collection === "products" ? "website" : "article"}"`,
        );
        expect(head).toContain(
          `<meta property="og:image" content="${expectedImage}"`,
        );
        expect(head).toContain(
          '<meta name="twitter:card" content="summary_large_image"',
        );
        expect(head).toContain(
          `<meta name="twitter:image" content="${expectedImage}"`,
        );
        await page.goto(`/${route}/${id}`);
        await expect(page).toHaveTitle(
          `메타데이터 "검증" <${index}> | Collezio`,
        );
        await expect(page.locator('meta[name="description"]')).toHaveAttribute(
          "content",
          `본문 ${index} ${"가".repeat(154)}…`,
        );
        await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
          "content",
          `메타데이터 "검증" <${index}> | Collezio`,
        );
        await expect(
          page.locator('meta[property="og:description"]'),
        ).toHaveAttribute("content", `본문 ${index} ${"가".repeat(154)}…`);
        await expect(
          page.locator('meta[name="twitter:title"]'),
        ).toHaveAttribute("content", `메타데이터 "검증" <${index}> | Collezio`);
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
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        "content",
        "http://127.0.0.1:3100/share-default.jpg",
      );
    } finally {
      await request.delete(`${storageBase}/${encodeURIComponent(imagePath)}`, {
        headers: { Authorization: "Bearer owner" },
      });
      for (const id of ids) {
        await request.delete(`${documentsUrl}/${collection}/${id}`, {
          headers: { Authorization: "Bearer owner" },
        });
      }
    }
  });
}
