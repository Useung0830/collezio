import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import {
  parseProductFields,
  parseRegistrationFiles,
} from "../../functions/src/productRegistrationData.js";
import { hashProductFile } from "../../src/features/products/utils/hashProductFile.ts";
const product = {
  title: " 상품 ",
  description: " 설명 ",
  category: "figure",
  transaction: { type: "sale", price: 0 },
  delivery: { type: "parcel", shippingFee: 0 },
};
test("서버 상품 검증은 정상 값을 정규화하고 과도한 길이·위조 필드·금액을 거부한다", () => {
  assert.equal(parseProductFields(product).title, "상품");
  assert.equal(parseProductFields(product).category, "figure");
  const legacyProduct = { ...product };
  delete legacyProduct.category;
  assert.equal(parseProductFields(legacyProduct).category, "other");
  for (const input of [
    { ...product, sellerId: "other" },
    { ...product, title: " " },
    { ...product, description: "x".repeat(5001) },
    { ...product, category: "unknown" },
    { ...product, transaction: { type: "sale", price: -1 } },
    { ...product, transaction: { type: "sale", price: 1.5 } },
    { ...product, delivery: { type: "parcel", shippingFee: Infinity } },
    { ...product, delivery: { type: "direct", location: " " } },
  ])
    assert.throws(() => parseProductFields(input));
});
test("파일 해시는 같은 원본을 식별하고 업로드 전에 크기·형식을 검사한다", async () => {
  const image = new File(["same"], "a.png", { type: "image/png" });
  const renamed = new File(["same"], "b.png", { type: "image/png" });
  assert.equal(await hashProductFile(image), await hashProductFile(renamed));
  await assert.rejects(
    hashProductFile(new File([], "empty.png", { type: "image/png" })),
  );
  await assert.rejects(
    hashProductFile(new File(["svg"], "a.svg", { type: "image/svg+xml" })),
  );
});
test("등록 파일 목록은 경로 주입·중복 ID·용량 초과를 거부한다", () => {
  const file = {
    id: randomUUID(),
    name: "figure.png",
    contentType: "image/png",
    size: 100,
    sha256: "a".repeat(64),
  };
  const id = randomUUID();
  assert.equal(
    parseRegistrationFiles([file], "owner", id)[0].path,
    "products/owner/" + id + "-" + file.id,
  );
  for (const files of [
    [],
    [file, file],
    [{ ...file, path: "products/other/file" }],
    [{ ...file, id: "../other" }],
    [{ ...file, size: 5 * 1024 * 1024 + 1 }],
  ])
    assert.throws(() => parseRegistrationFiles(files, "owner", id));
});
