import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

import { expect, test } from "./fixtures";

const documentsUrl =
  "http://127.0.0.1:8080/v1/projects/demo-collezio/databases/(default)/documents";

test("상품 등록은 사진을 압축해 저장하고 손상 사진의 오류를 표시한다", async ({
  page,
  request,
}) => {
  test.setTimeout(60_000);
  const email = `${randomUUID()}@example.com`;
  const password = "Test1234!";
  const signup = await request.post(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key",
    {
      data: { email, password, returnSecureToken: true },
    },
  );
  expect(signup.ok()).toBeTruthy();
  const { localId: userId, idToken } = await signup.json();
  const profile = await request.post(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-api-key",
    {
      data: {
        idToken,
        displayName: `사진${randomUUID().slice(0, 6)}`,
        returnSecureToken: true,
      },
    },
  );
  expect(profile.ok()).toBeTruthy();

  // The app stores canonical URLs; image requests must only read the local bucket.
  await page.route("**/_next/image?**", async (route) => {
    const source = new URL(
      new URL(route.request().url()).searchParams.get("url") ?? "",
      "http://127.0.0.1:3100",
    );
    if (source.hostname !== "firebasestorage.googleapis.com")
      return route.continue();
    expect(source.pathname).toContain("/b/demo-collezio.appspot.com/");
    const response = await request.get(
      `http://127.0.0.1:9199${source.pathname}${source.search}`,
    );
    await route.fulfill({ response });
  });

  await page.goto("/login");
  await page.getByLabel("이메일", { exact: true }).fill(email);
  await page.getByLabel("비밀번호", { exact: true }).fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
  await page.goto("/products/new");
  const title = `압축 등록 ${randomUUID().slice(0, 8)}`;
  await page.getByLabel("제목", { exact: true }).fill(title);
  await page
    .getByLabel("자세한 설명", { exact: true })
    .fill("해상도를 유지한 상품 사진입니다.");
  await page
    .locator("label")
    .filter({ has: page.getByRole("radio", { name: "판매하기", exact: true }) })
    .click();
  await page.getByPlaceholder("판매 가격을 입력해주세요.").fill("12000");
  await page
    .locator("label")
    .filter({
      has: page.getByRole("radio", { name: "택배 거래", exact: true }),
    })
    .click();
  await page.getByRole("button", { name: "무료 배송", exact: true }).click();
  const files = page.getByLabel("사진 첨부", { exact: true });
  const original = await readFile("src/assets/images/product-luffy-cutout.png");
  const uploadedPaths: string[] = [];
  page.on("response", async (response) => {
    if (response.url().endsWith("/uploadProductImage") && response.ok()) {
      const body = await response.json();
      if (body.result?.path) uploadedPaths.push(body.result.path);
    }
  });
  await files.setInputFiles([
    {
      name: "figure.png",
      mimeType: "image/png",
      buffer: original,
    },
    {
      name: "broken.png",
      mimeType: "image/png",
      buffer: Buffer.from("not an image"),
    },
  ]);
  await page.getByRole("button", { name: "판매하기", exact: true }).click();
  await expect(
    page.getByText(
      "사진을 읽을 수 없습니다. 손상 여부와 해상도를 확인해주세요.",
      { exact: true },
    ),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page).toHaveURL(/\/products\/new$/);
  await expect(page.getByLabel("제목", { exact: true })).toHaveValue(title);
  await expect.poll(() => uploadedPaths.length).toBe(1);
  const removed = await request.get(
    `http://127.0.0.1:9199/v0/b/demo-collezio.appspot.com/o/${encodeURIComponent(uploadedPaths[0])}`,
  );
  expect(removed.status()).toBe(404);
  await page.getByRole("button", { name: "broken.png 삭제" }).click();

  await page.getByRole("button", { name: "판매하기", exact: true }).click();
  await expect(page).toHaveURL(/\/collections$/, { timeout: 30_000 });
  const response = await request.get(`${documentsUrl}/products`, {
    headers: { Authorization: "Bearer owner" },
  });
  const product = (await response.json()).documents.find(
    (document: { fields: { title: { stringValue: string } } }) =>
      document.fields.title.stringValue === title,
  );
  expect(product).toBeTruthy();
  const stored = product.fields.images.arrayValue.values[0].mapValue.fields;
  expect(uploadedPaths).toHaveLength(2);
  expect(stored.path.stringValue).toBe(uploadedPaths[1]);
  expect(uploadedPaths[1]).not.toBe(uploadedPaths[0]);
  expect(stored.path.stringValue).toMatch(new RegExp(`^products/${userId}/`));
  const metadataResponse = await request.get(
    `http://127.0.0.1:9199/v0/b/demo-collezio.appspot.com/o/${encodeURIComponent(stored.path.stringValue)}`,
  );
  expect(metadataResponse.ok()).toBeTruthy();
  const metadata = await metadataResponse.json();
  expect(metadata.contentType).toBe("image/webp");
  expect(Number(metadata.size)).toBeLessThan(original.length);
  expect(metadata.metadata.width).toBe("1254");
  expect(metadata.metadata.height).toBe("1254");
  await page
    .getByRole("link")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) })
    .click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: title, exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: title, exact: true }).first(),
  ).toHaveJSProperty("complete", true);
  expect(
    await page
      .getByRole("img", { name: title, exact: true })
      .first()
      .evaluate((image: HTMLImageElement) => image.naturalWidth),
  ).toBeGreaterThan(0);

  await request.delete(
    `${documentsUrl}/products/${product.name.split("/").pop()}`,
    { headers: { Authorization: "Bearer owner" } },
  );
});

test("업로드 응답 유실 후 창을 다시 열면 서버 기록으로 등록을 이어간다", async ({
  page,
  context,
  request,
}) => {
  test.setTimeout(60_000);
  const email = randomUUID() + "@example.com",
    password = "Test1234!";
  const signup = await request.post(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key",
    { data: { email, password, returnSecureToken: true } },
  );
  const { localId: userId, idToken } = await signup.json();
  const nickname = "복구" + randomUUID().slice(0, 6);
  await request.post(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-api-key",
    { data: { idToken, displayName: nickname, returnSecureToken: true } },
  );
  const call = (name: string, data: unknown) =>
    request.post(
      "http://127.0.0.1:5001/demo-collezio/asia-northeast3/" + name,
      { headers: { Authorization: "Bearer " + idToken }, data: { data } },
    );
  const registrationId = randomUUID(),
    imageId = randomUUID();
  const image = await readFile("src/assets/images/product-luffy-cutout.png");
  const { createHash } = await import("node:crypto");
  const begin = await call("beginProductRegistration", {
    registrationId,
    product: {
      title: "응답 유실 복구",
      description: "서버 기록 복원",
      transaction: { type: "sale", price: 1000 },
      delivery: { type: "parcel", shippingFee: 0 },
    },
    files: [
      {
        id: imageId,
        name: "figure.png",
        size: image.length,
        contentType: "image/png",
        sha256: createHash("sha256").update(image).digest("hex"),
      },
    ],
  });
  expect(begin.ok()).toBeTruthy();
  // The browser never receives or saves this upload response.
  const uploaded = await call("uploadProductImage", {
    registrationId,
    imageId,
    base64: image.toString("base64"),
    contentType: "image/png",
  });
  expect(uploaded.ok()).toBeTruthy();
  await page.goto("/login");
  await page.getByLabel("이메일", { exact: true }).fill(email);
  await page.getByLabel("비밀번호", { exact: true }).fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
  await page.close();
  const reopened = await context.newPage();
  let uploadRequests = 0;
  reopened.on("request", (request) => {
    if (request.url().endsWith("/uploadProductImage")) uploadRequests++;
  });
  await reopened.route("**/_next/image?**", async (route) => {
    const source = new URL(
      new URL(route.request().url()).searchParams.get("url") ?? "",
      "http://127.0.0.1:3100",
    );
    if (source.hostname !== "firebasestorage.googleapis.com")
      return route.continue();
    const response = await request.get(
      "http://127.0.0.1:9199" + source.pathname + source.search,
    );
    await route.fulfill({ response });
  });
  await reopened.goto("/products/new");
  await expect(
    reopened.getByRole("region", { name: "이전 상품 등록" }),
  ).toBeVisible();
  await expect(
    reopened.getByText("사진 1/1장 저장 완료.", { exact: false }),
  ).toBeVisible();
  await reopened
    .getByRole("button", { name: "등록 이어서 진행", exact: true })
    .click();
  await expect(reopened).toHaveURL(
    "http://127.0.0.1:3100/products/" + registrationId,
    { timeout: 30_000 },
  );
  expect(uploadRequests).toBe(0);
  const document = await request.get(
    documentsUrl + "/products/" + registrationId,
    { headers: { Authorization: "Bearer owner" } },
  );
  expect(document.ok()).toBeTruthy();
  expect((await document.json()).fields.sellerId.stringValue).toBe(userId);
  const repeat = await call("completeProductRegistration", { registrationId });
  expect((await repeat.json()).result.productId).toBe(registrationId);
  await reopened.close();
});
