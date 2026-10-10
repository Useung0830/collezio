import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

import { formatMetadataText } from "../../src/utils/formatMetadataText.ts";
import { getShareImageUrl } from "../../src/utils/getShareImageUrl.ts";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { url: "data:text/javascript,export {};", shortCircuit: true };
    }
    if (specifier.startsWith("@/")) {
      return nextResolve(
        new URL(`../../src/${specifier.slice(2)}.ts`, import.meta.url).href,
        context,
      );
    }
    return nextResolve(specifier, context);
  },
});

const { getProductMetadata } =
  await import("../../src/features/products/api/getProductMetadata.ts");
const { getCommunityPostMetadata } =
  await import("../../src/features/community/api/getCommunityPostMetadata.ts");
const { createShareMetadata } =
  await import("../../src/lib/createShareMetadata.ts");
const { getSiteUrl } = await import("../../src/lib/getSiteUrl.ts");

test.beforeEach((t) => {
  const original = { ...process.env };
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "demo-collezio";
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = "true";
  process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT = "8080";
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "demo-collezio.appspot.com";
  process.env.SITE_URL = "https://collezio.example";
  t.after(() => {
    process.env = original;
  });
});

test("메타데이터 요약은 공백을 정리하고 이모지를 자르지 않는다", () => {
  assert.equal(formatMetadataText("  제목\n\t본문  ", 160), "제목 본문");
  assert.equal(
    formatMetadataText("😀".repeat(161), 160),
    `${"😀".repeat(159)}…`,
  );
});

test("상품·게시글은 인증 없이 필요한 필드만 조회하고 서로 다른 원문을 요약한다", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    const isProduct = url.pathname.includes("/products/");
    return Response.json({
      fields: {
        title: { stringValue: isProduct ? "  피규어  " : "수집 이야기" },
        description: { stringValue: "상품\n설명" },
        content: { stringValue: "가".repeat(200) },
      },
    });
  });
  assert.deepEqual(await getProductMetadata("product"), {
    title: "피규어",
    description: "상품 설명",
    imageUrl: null,
  });
  assert.deepEqual(await getCommunityPostMetadata("post"), {
    title: "수집 이야기",
    description: `${"가".repeat(159)}…`,
    imageUrl: null,
  });
  assert.deepEqual(calls[0].url.searchParams.getAll("mask.fieldPaths"), [
    "title",
    "description",
    "images",
    "sellerId",
  ]);
  assert.deepEqual(calls[1].url.searchParams.getAll("mask.fieldPaths"), [
    "title",
    "content",
    "images",
    "authorId",
  ]);
  for (const { url, options } of calls) {
    assert.equal(url.origin, "http://127.0.0.1:8080");
    assert.equal(options.cache, "no-store");
    assert.equal(options.headers, undefined);
    assert.ok(options.signal instanceof AbortSignal);
  }
});

test("잘못된 ID는 요청하지 않고 특수문자는 문서 ID로 인코딩한다", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async (url) => {
    assert.ok(url.pathname.endsWith("/id%3Fmask%3Dsecret%23part"));
    return Response.json({ fields: { title: { stringValue: "제목" } } });
  });
  for (const id of ["", ".", "..", "products/secret"]) {
    assert.equal(await getProductMetadata(id), null);
  }
  assert.equal(fetchMock.mock.callCount(), 0);
  await getProductMetadata("id?mask=secret#part");
});

test("미존재·권한 거부는 상세 정보를 반환하지 않고 장애와 구분한다", async (t) => {
  for (const status of [403, 404]) {
    t.mock.method(
      globalThis,
      "fetch",
      async () => new Response(null, { status }),
    );
    assert.equal(await getProductMetadata("id"), null);
  }
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response(null, { status: 503 }),
  );
  await assert.rejects(getProductMetadata("id"));
  t.mock.method(globalThis, "fetch", async () => {
    throw new DOMException("Timed out", "TimeoutError");
  });
  await assert.rejects(getCommunityPostMetadata("id"), {
    name: "TimeoutError",
  });
});

test("잘못된 응답 타입과 빈 제목을 메타데이터에 노출하지 않는다", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ fields: { title: { integerValue: "1" } } }),
  );
  assert.equal(await getProductMetadata("id"), null);
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ fields: { title: { stringValue: "  " } } }),
  );
  assert.equal(await getCommunityPostMetadata("id"), null);
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ fields: null }),
  );
  await assert.rejects(getProductMetadata("id"));
});

test("에뮬레이터에 운영 프로젝트를 연결하지 않는다", async (t) => {
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "production-project";
  const fetchMock = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Unexpected fetch");
  });
  await assert.rejects(getProductMetadata("id"), /demo-collezio/);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("공유 이미지는 올바른 버킷·문서 경로의 첫 이미지만 선택한다", () => {
  const bucket = "demo-collezio.appspot.com";
  const path = "community/author/post/image-1";
  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media&token=token-1`;
  const valid = { path, url };
  const options = { bucket, pathPrefix: "community/author/post/" };
  for (const invalid of [
    { path, url: url.replace(bucket, "other-bucket") },
    { path, url: url.replace("https:", "http:") },
    { path, url: url.replace("firebasestorage.googleapis.com", "example.com") },
    { path, url: `${url}#fragment` },
    { path, url: url.replace("https://", "https://user:password@") },
    { path, url: url.replace("alt=media", "alt=json") },
    { path, url: `${url}&other=value` },
    { path: "community/other/post/image-1", url },
    { path: "chat/room/author/image-1", url },
    { path: `${path}/extra`, url },
  ]) {
    assert.equal(getShareImageUrl({ ...options, images: [invalid] }), null);
    assert.equal(
      getShareImageUrl({ ...options, images: [invalid, valid] }),
      url,
    );
  }
  assert.equal(getShareImageUrl({ ...options, images: [] }), null);
  assert.equal(
    getShareImageUrl({ ...options, images: [valid], bucket: undefined }),
    null,
  );
});

test("Firestore 이미지 배열을 해석하고 다른 소유자 이미지는 제외한다", async (t) => {
  for (const [getMetadata, id, ownerField, prefix] of [
    [getProductMetadata, "product", "sellerId", "products/owner/"],
    [getCommunityPostMetadata, "post", "authorId", "community/owner/post/"],
  ]) {
    const path = `${prefix}image-1`;
    const url = `https://firebasestorage.googleapis.com/v0/b/demo-collezio.appspot.com/o/${encodeURIComponent(path)}?alt=media`;
    const fields = {
      title: { stringValue: "제목" },
      [ownerField]: { stringValue: "owner" },
      images: {
        arrayValue: {
          values: [
            {
              mapValue: {
                fields: {
                  path: { stringValue: path },
                  url: { stringValue: url },
                },
              },
            },
          ],
        },
      },
    };
    t.mock.method(globalThis, "fetch", async () => Response.json({ fields }));
    assert.equal((await getMetadata(id)).imageUrl, url);
    fields[ownerField] = { stringValue: "other" };
    assert.equal((await getMetadata(id)).imageUrl, null);
  }
});

test("공유 메타데이터의 제목·이미지·대표 주소와 기본 이미지를 일치시킨다", () => {
  const input = {
    title: "상품",
    description: "설명",
    path: "/products/id",
    type: "website",
  };
  const fallback = createShareMetadata(input);
  assert.equal(
    fallback.alternates.canonical,
    "https://collezio.example/products/id",
  );
  assert.equal(fallback.openGraph.url, fallback.alternates.canonical);
  assert.equal(fallback.openGraph.title, "상품 | Collezio");
  assert.equal(fallback.twitter.title, fallback.openGraph.title);
  assert.deepEqual(fallback.twitter.images, fallback.openGraph.images);
  assert.equal(
    fallback.openGraph.images[0].url,
    "https://collezio.example/share-default.jpg",
  );
  assert.equal(fallback.twitter.card, "summary_large_image");
  const article = createShareMetadata({
    ...input,
    type: "article",
    imageUrl: "https://example.com/photo.jpg",
  });
  assert.equal(article.openGraph.type, "article");
  assert.equal(
    article.openGraph.images[0].url,
    "https://example.com/photo.jpg",
  );
  assert.deepEqual(createShareMetadata({ ...input, noindex: true }).robots, {
    index: false,
  });
});

test("사이트 주소는 운영 HTTPS 또는 로컬 HTTP origin만 허용한다", () => {
  for (const value of [
    "http://example.com",
    "https://example.com/path",
    "https://example.com?x=1",
    "https://example.com#hash",
    "https://user:secret@example.com",
    "invalid",
  ]) {
    process.env.SITE_URL = value;
    assert.throws(getSiteUrl);
  }
  process.env.SITE_URL = "http://127.0.0.1:3100";
  assert.equal(getSiteUrl().origin, "http://127.0.0.1:3100");
});
