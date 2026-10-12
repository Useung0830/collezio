import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

export async function seedProduct(
  input,
  userId,
  id = randomUUID(),
  hasCount = true,
) {
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080");
  const encode = (value) => {
    if (typeof value === "string") return { stringValue: value };
    if (typeof value === "number") return { integerValue: String(value) };
    if (Array.isArray(value))
      return { arrayValue: { values: value.map(encode) } };
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value).map(([key, item]) => [key, encode(item)]),
        ),
      },
    };
  };
  const fields = encode({
    ...input,
    sellerId: userId,
    status: "available",
    ...(hasCount ? { favoriteCount: 0 } : {}),
  }).mapValue.fields;
  fields.createdAt = { timestampValue: new Date().toISOString() };
  const response = await fetch(
    "http://127.0.0.1:8080/v1/projects/demo-collezio/databases/(default)/documents/products/" +
      id,
    {
      method: "PATCH",
      headers: {
        Authorization: "Bearer owner",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    },
  );
  assert.equal(response.ok, true, await response.text());
  return id;
}
