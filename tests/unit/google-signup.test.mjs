import assert from "node:assert/strict";
import test from "node:test";

import { isGoogleOnlyUser } from "../../src/features/auth/utils/isGoogleOnlyUser.ts";

test("Google 단독 계정만 추가 가입 대상으로 분류한다", () => {
  assert.equal(isGoogleOnlyUser(null), false);
  assert.equal(isGoogleOnlyUser({ providerData: [] }), false);
  assert.equal(
    isGoogleOnlyUser({ providerData: [{ providerId: "google.com" }] }),
    true,
  );
  assert.equal(
    isGoogleOnlyUser({ providerData: [{ providerId: "password" }] }),
    false,
  );
  assert.equal(
    isGoogleOnlyUser({
      providerData: [{ providerId: "password" }, { providerId: "google.com" }],
    }),
    false,
  );
});
