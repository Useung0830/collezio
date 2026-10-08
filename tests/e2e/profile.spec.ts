import { randomUUID } from "node:crypto";

import { expect, test } from "./fixtures";

test("기존 계정의 프로필을 생성하고 비로그인 방문자에게 상품 판매자를 표시한다", async ({
  page,
  request,
  browser,
}) => {
  const email = `${randomUUID()}@example.com`;
  const password = "Test1234!";
  const signup = await request.post(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key",
    {
      data: { email, password, returnSecureToken: true },
    },
  );
  expect(signup.ok()).toBeTruthy();
  const account = await signup.json();
  const update = await request.post(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-api-key",
    {
      data: { idToken: account.idToken, displayName: "기존판매자" },
    },
  );
  expect(update.ok()).toBeTruthy();
  await page.goto("/login");
  await page.getByLabel("이메일", { exact: true }).fill(email);
  await page.getByLabel("비밀번호", { exact: true }).fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
  await page.goto("/collections");
  const ownProfile = page.getByRole("region", { name: "내 프로필" });
  await expect(
    ownProfile.getByText("기존판매자", { exact: true }),
  ).toBeVisible();
  await expect(
    ownProfile.getByText("평가 없음", { exact: true }),
  ).toBeVisible();
  await expect(
    ownProfile.getByText("거래 횟수 미집계", { exact: true }),
  ).toBeVisible();

  const editButton = ownProfile.getByRole("button", { name: "프로필 수정" });
  await editButton.click();
  const modal = page.getByRole("dialog", { name: "프로필 수정" });
  await expect(
    modal.getByRole("button", { name: "저장", exact: true }),
  ).toBeDisabled();
  await modal.getByLabel("닉네임").fill("취소할이름");
  await page.keyboard.press("Escape");
  await expect(modal).not.toBeVisible();
  await expect(editButton).toBeFocused();
  await expect(
    ownProfile.getByText("기존판매자", { exact: true }),
  ).toBeVisible();
  await editButton.click();
  await expect(modal.getByLabel("닉네임")).toHaveValue("기존판매자");
  await modal.getByLabel("닉네임").fill("변경판매자");
  await modal
    .getByLabel("프로필 사진", { exact: true })
    .setInputFiles("src/assets/images/profile.png");
  await expect(
    modal.getByRole("img", { name: "변경판매자 프로필" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/profile-edit-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await modal.getByRole("button", { name: "저장", exact: true }).click();
  await expect(modal).not.toBeVisible();
  await expect(
    ownProfile.getByText("변경판매자", { exact: true }),
  ).toBeVisible();
  await expect(
    ownProfile.getByRole("img", { name: "변경판매자 프로필" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    ownProfile.getByText("변경판매자", { exact: true }),
  ).toBeVisible();
  await expect(
    ownProfile.getByRole("img", { name: "변경판매자 프로필" }),
  ).toBeVisible();

  const productId = randomUUID();
  const productResponse = await request.patch(
    `http://127.0.0.1:8080/v1/projects/demo-collezio/databases/(default)/documents/products/${productId}`,
    {
      headers: { Authorization: "Bearer owner" },
      data: {
        fields: {
          sellerId: { stringValue: account.localId },
          title: { stringValue: "프로필 연결 상품" },
          description: { stringValue: "실제 판매자 연결 확인" },
          status: { stringValue: "available" },
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
  expect(productResponse.ok()).toBeTruthy();
  const visitor = await browser.newContext();
  try {
    const publicPage = await visitor.newPage();
    await publicPage.goto(`http://127.0.0.1:3100/products/${productId}`);
    await expect(
      publicPage.getByRole("heading", { name: "프로필 연결 상품" }),
    ).toBeVisible();
    const seller = publicPage.getByRole("region", { name: "판매자 프로필" });
    await expect(seller.getByText("변경판매자", { exact: true })).toBeVisible();
    await publicPage.setViewportSize({ width: 390, height: 844 });
    await expect(seller).toBeVisible();
    expect(
      await publicPage.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    await publicPage.screenshot({
      path: "test-results/profile-mobile.png",
      fullPage: true,
    });
  } finally {
    await visitor.close();
  }
});
