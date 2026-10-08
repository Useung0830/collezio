import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { deleteApp, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import {
  getNicknameKey,
  isNicknameAvailable,
  parseNickname,
} from "../src/profileNickname.js";
import { savePublicProfile } from "../src/savePublicProfile.js";

test("닉네임 길이와 앞뒤 공백을 검증한다", () => {
  assert.equal(parseNickname(" 사용자 "), "사용자");
  for (const input of [null, {}, " ", "가", "가".repeat(11)])
    assert.throws(() => parseNickname(input));
});

test("닉네임 동시 등록·기존 사용자 중복·변경 후 재사용을 보장한다", async () => {
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
  const app = initializeApp({ projectId: "demo-collezio" }, randomUUID());
  const db = getFirestore(app);
  const userA = randomUUID(),
    userB = randomUUID(),
    legacyId = randomUUID();
  const nickname = randomUUID().slice(0, 8),
    next = randomUUID().slice(0, 8),
    legacy = randomUUID().slice(0, 8);
  const save = (userId, mode, name, extra = {}) =>
    savePublicProfile(
      db,
      userId,
      { mode, nickname: name, ...extra },
      "demo-collezio.appspot.com",
    );
  try {
    const results = await Promise.allSettled([
      save(userA, "create", nickname),
      save(userB, "create", nickname),
    ]);
    assert.equal(
      results.filter((result) => result.status === "fulfilled").length,
      1,
    );
    assert.equal(
      results.find((result) => result.status === "rejected").reason.code,
      "already-exists",
    );
    const winner = results[0].status === "fulfilled" ? userA : userB;
    const loser = winner === userA ? userB : userA;
    assert.equal(await isNicknameAvailable(db, ` ${nickname} `), false);
    assert.equal(await isNicknameAvailable(db, nickname, winner), true);
    await save(winner, "update", nickname);
    await db.doc(`profiles/${legacyId}`).set({
      nickname: legacy,
      imageUrl: null,
      bio: "",
      rating: 4.5,
      tradeCount: 2,
    });
    assert.equal(await isNicknameAvailable(db, legacy), false);
    await assert.rejects(save(winner, "update", legacy), {
      code: "already-exists",
    });
    await save(winner, "update", next);
    assert.equal(await isNicknameAvailable(db, nickname), true);
    await save(loser, "create", nickname);
    assert.equal(
      (await db.doc(`nicknames/${getNicknameKey(nickname)}`).get()).get(
        "userId",
      ),
      loser,
    );
    // 생성 재시도가 수정된 이름을 원래 이름으로 되돌리지 않습니다.
    assert.equal(
      (await save(winner, "create", nickname)).profile.nickname,
      next,
    );
    await save(legacyId, "update", legacy, { rating: 5, tradeCount: 999 });
    assert.equal(
      (await db.doc(`profiles/${legacyId}`).get()).get("rating"),
      4.5,
    );
    assert.equal(
      (await db.doc(`profiles/${legacyId}`).get()).get("tradeCount"),
      2,
    );
    await assert.rejects(
      save(winner, "update", next, {
        image: {
          path: `profiles/${loser}/photo`,
          url: "https://example.com/photo",
        },
      }),
      { code: "invalid-argument" },
    );
    await db.doc(`withdrawalRequests/${winner}`).set({ status: "processing" });
    await assert.rejects(save(winner, "update", next), {
      code: "permission-denied",
    });
    await assert.rejects(save(null, "create", next), {
      code: "unauthenticated",
    });
  } finally {
    await Promise.all([
      ...[userA, userB, legacyId].map((id) =>
        db.doc(`profiles/${id}`).delete(),
      ),
      ...[nickname, next, legacy].map((name) =>
        db.doc(`nicknames/${getNicknameKey(name)}`).delete(),
      ),
      db.doc(`withdrawalRequests/${userA}`).delete(),
      db.doc(`withdrawalRequests/${userB}`).delete(),
    ]);
    await deleteApp(app);
  }
});
