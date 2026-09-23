import assert from "node:assert/strict";
import test from "node:test";

import { deleteApp, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
} from "firebase/auth";
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

test("프로필 규칙은 공개 단건 조회와 본인 생성을 허용하고 위조·수정·목록 조회를 거부한다", async () => {
  assert.ok(
    process.env.FIRESTORE_EMULATOR_HOST,
    "Firestore 에뮬레이터에서만 실행합니다.",
  );
  assert.ok(
    process.env.FIREBASE_AUTH_EMULATOR_HOST,
    "Auth 에뮬레이터에서만 실행합니다.",
  );
  const app = initializeApp(
    { projectId: "demo-collezio", apiKey: "demo-key" },
    "profile-rules",
  );
  const auth = getAuth(app);
  const db = getFirestore(app);
  connectAuthEmulator(
    auth,
    `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`,
    { disableWarnings: true },
  );
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(":");
  connectFirestoreEmulator(db, host, Number(port));
  const denied = (error) => error.code === "permission-denied";
  try {
    const { user } = await createUserWithEmailAndPassword(
      auth,
      `profile-${Date.now()}@example.com`,
      "Test-password-123!",
    );
    const own = doc(db, "profiles", user.uid);
    const data = {
      nickname: "판매자",
      imageUrl: null,
      bio: "",
      createdAt: serverTimestamp(),
    };
    await assert.rejects(
      setDoc(doc(db, "profiles", "other-user"), data),
      denied,
    );
    await assert.rejects(
      setDoc(own, { ...data, rating: 5, tradeCount: 100 }),
      denied,
    );
    await assert.rejects(
      setDoc(own, { ...data, email: "private@example.com" }),
      denied,
    );
    await runTransaction(db, async (transaction) => {
      assert.equal((await transaction.get(own)).exists(), false);
      transaction.set(own, data);
    });
    assert.equal((await getDoc(own)).data().nickname, "판매자");
    await assert.rejects(updateDoc(own, { rating: 5 }), denied);
    await assert.rejects(getDocs(collection(db, "profiles")), denied);
    await signOut(auth);
    assert.equal((await getDoc(own)).data().nickname, "판매자");
    assert.equal(
      (await getDoc(doc(db, "profiles", "missing"))).exists(),
      false,
    );
    await assert.rejects(
      setDoc(doc(db, "profiles", "anonymous"), data),
      denied,
    );
    // 기존 상품 공개 읽기 정책도 유지합니다.
    assert.equal(
      (await getDoc(doc(db, "products", "missing"))).exists(),
      false,
    );
  } finally {
    await deleteApp(app);
  }
});
