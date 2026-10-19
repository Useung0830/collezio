import assert from "node:assert/strict";
import test from "node:test";

import { FirebaseError } from "firebase/app";

import { getWithdrawalError } from "../../src/features/auth/utils/getWithdrawalError.ts";

test("Google 재인증 취소·차단·다른 계정 선택을 구분해 안내한다", () => {
  assert.match(
    getWithdrawalError(new FirebaseError("auth/popup-closed-by-user", "")),
    /취소/,
  );
  assert.match(
    getWithdrawalError(new FirebaseError("auth/popup-blocked", "")),
    /팝업을 허용/,
  );
  assert.match(
    getWithdrawalError(new FirebaseError("auth/user-mismatch", "")),
    /현재 로그인한 Google 계정/,
  );
  assert.match(
    getWithdrawalError(new FirebaseError("auth/wrong-password", "")),
    /비밀번호가 올바르지/,
  );
  assert.match(
    getWithdrawalError(new FirebaseError("functions/failed-precondition", "")),
    /다시 인증/,
  );
  assert.equal(getWithdrawalError(null), "");
  assert.equal(
    getWithdrawalError(new Error("인터넷 연결 후 다시 시도해주세요.")),
    "인터넷 연결 후 다시 시도해주세요.",
  );
});
