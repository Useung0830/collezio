import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

import { deleteApp, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDocFromServer,
  getDocs,
  getFirestore,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

test("찜 API와 권한 규칙", async (t) => {
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST, "에뮬레이터가 필요합니다.");
  assert.ok(
    process.env.FIREBASE_AUTH_EMULATOR_HOST,
    "에뮬레이터가 필요합니다.",
  );

  // 실제 API를 Node에서 로드하되 Firebase 연결은 demo 에뮬레이터로 제한합니다.
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "demo-collezio";
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "demo-key";
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "demo-collezio.appspot.com";
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === "client-only") {
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
  const { firebaseApp, firebaseAuth, firebaseDb } =
    await import("../../src/lib/firebase.ts");
  const { updateProductFavorite } =
    await import("../../src/features/favorite/api/updateProductFavorite.ts");
  const { getProductFavorite } =
    await import("../../src/features/favorite/api/getProductFavorite.ts");
  const { createProduct } =
    await import("../../src/features/products/api/createProduct.ts");

  const secondApp = initializeApp(
    { projectId: "demo-collezio", apiKey: "demo-key" },
    "favorite-second-user",
  );
  const secondAuth = getAuth(secondApp);
  const secondDb = getFirestore(secondApp);
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(":");
  for (const [auth, db] of [
    [firebaseAuth, firebaseDb],
    [secondAuth, secondDb],
  ]) {
    connectAuthEmulator(
      auth,
      `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`,
      { disableWarnings: true },
    );
    connectFirestoreEmulator(db, host, Number(port));
  }
  const denied = (error) => error.code === "permission-denied";
  const input = {
    title: "찜 테스트 상품",
    description: "상품 설명",
    transaction: { type: "sale", price: 10000 },
    delivery: { type: "parcel", shippingFee: 0 },
    images: [{ url: "https://example.com/image.png", path: "test/image" }],
  };

  try {
    const { user } = await createUserWithEmailAndPassword(
      firebaseAuth,
      `favorite-${Date.now()}@example.com`,
      "Test-password-123!",
    );
    const { user: secondUser } = await createUserWithEmailAndPassword(
      secondAuth,
      `favorite-second-${Date.now()}@example.com`,
      "Test-password-123!",
    );
    await updateProfile(user, { displayName: "찜 테스트 사용자" });
    const productId = await createProduct(input);
    const fullGalleryId = await createProduct({
      ...input,
      images: Array.from({ length: 10 }, () => input.images[0]),
    });
    assert.equal(
      (
        await getDocFromServer(doc(firebaseDb, "products", fullGalleryId))
      ).data().favoriteCount,
      0,
    );
    const productRef = doc(firebaseDb, "products", productId);
    const favoriteRef = doc(
      firebaseDb,
      "users",
      user.uid,
      "favorites",
      productId,
    );
    const update = (isFavorite) =>
      updateProductFavorite({ productId, userId: user.uid, isFavorite });
    const count = async () =>
      (await getDocFromServer(productRef)).data().favoriteCount;

    await t.test(
      "신규 상품은 0으로 시작하고 찜 저장·조회·취소가 일치한다",
      async () => {
        assert.equal(await count(), 0);
        assert.equal(await getProductFavorite(productId, user.uid), false);
        assert.deepEqual(await update(true), {
          isFavorite: true,
          favoriteCount: 1,
        });
        assert.equal(await count(), 1);
        assert.equal(await getProductFavorite(productId, user.uid), true);
        assert.ok((await getDocFromServer(favoriteRef)).data().createdAt);
        assert.deepEqual(await update(false), {
          isFavorite: false,
          favoriteCount: 0,
        });
        assert.equal(await count(), 0);
        assert.equal(await getProductFavorite(productId, user.uid), false);
      },
    );

    await t.test(
      "같은 사용자의 동시 요청과 반복 취소는 중복 집계하지 않는다",
      async () => {
        await Promise.all([update(true), update(true), update(true)]);
        assert.equal(await count(), 1);
        await Promise.all([update(false), update(false)]);
        await update(false);
        assert.equal(await count(), 0);
      },
    );

    await t.test(
      "카운트가 없는 기존 상품도 첫 찜과 취소를 지원한다",
      async () => {
        const legacyRef = doc(collection(firebaseDb, "products"));
        await setDoc(legacyRef, {
          ...input,
          sellerId: user.uid,
          status: "available",
          createdAt: serverTimestamp(),
        });
        for (const isFavorite of [true, false]) {
          await updateProductFavorite({
            productId: legacyRef.id,
            userId: user.uid,
            isFavorite,
          });
          assert.equal(
            (await getDocFromServer(legacyRef)).data().favoriteCount,
            isFavorite ? 1 : 0,
          );
        }
      },
    );

    await t.test("카운트나 찜 기록만 따로 바꾸는 요청은 거부한다", async () => {
      await assert.rejects(updateDoc(productRef, { favoriteCount: 1 }), denied);
      await assert.rejects(
        setDoc(favoriteRef, { createdAt: serverTimestamp() }),
        denied,
      );
      await update(true);
      await assert.rejects(deleteDoc(favoriteRef), denied);
      await assert.rejects(
        updateDoc(favoriteRef, { createdAt: serverTimestamp() }),
        denied,
      );
      await update(false);
      assert.equal(await count(), 0);
    });

    await t.test(
      "임의 카운트·상품 수정·찜 기록 위조는 전체 저장을 거부한다",
      async () => {
        for (const favoriteCount of [-1, 0, 2, 1.5]) {
          const batch = writeBatch(firebaseDb);
          batch.set(favoriteRef, { createdAt: serverTimestamp() });
          batch.update(productRef, { favoriteCount });
          await assert.rejects(batch.commit(), denied);
        }
        for (const extraFields of [
          { title: "변조" },
          { sellerId: secondUser.uid },
        ]) {
          const batch = writeBatch(firebaseDb);
          batch.set(favoriteRef, { createdAt: serverTimestamp() });
          batch.update(productRef, { favoriteCount: 1, ...extraFields });
          await assert.rejects(batch.commit(), denied);
        }
        for (const favoriteData of [
          { createdAt: new Date(0) },
          { createdAt: serverTimestamp(), extra: true },
        ]) {
          const batch = writeBatch(firebaseDb);
          batch.set(favoriteRef, favoriteData);
          batch.update(productRef, { favoriteCount: 1 });
          await assert.rejects(batch.commit(), denied);
        }
        assert.equal(await count(), 0);
        assert.equal(await getProductFavorite(productId, user.uid), false);
      },
    );

    await t.test(
      "찜 수를 부풀린 상품 등록과 없는 상품의 찜을 거부한다",
      async () => {
        await assert.rejects(
          setDoc(doc(collection(firebaseDb, "products")), {
            ...input,
            sellerId: user.uid,
            status: "available",
            favoriteCount: 10,
            createdAt: serverTimestamp(),
          }),
          denied,
        );
        await assert.rejects(
          updateProductFavorite({
            productId: "missing-product",
            userId: user.uid,
            isFavorite: true,
          }),
          /상품을 찾을 수 없습니다/,
        );
        await assert.rejects(
          setDoc(
            doc(firebaseDb, "users", user.uid, "favorites", "missing-product"),
            {
              createdAt: serverTimestamp(),
            },
          ),
          denied,
        );
      },
    );

    await t.test(
      "다른 사용자의 찜 기록 조회·목록·수정을 거부한다",
      async () => {
        const otherRef = doc(
          secondDb,
          "users",
          user.uid,
          "favorites",
          productId,
        );
        await assert.rejects(getDocFromServer(otherRef), denied);
        await assert.rejects(
          getDocs(collection(secondDb, "users", user.uid, "favorites")),
          denied,
        );
        await assert.rejects(
          setDoc(otherRef, { createdAt: serverTimestamp() }),
          denied,
        );
        await assert.rejects(
          updateProductFavorite({
            productId,
            userId: secondUser.uid,
            isFavorite: true,
          }),
          /로그인 상태/,
        );
        await assert.rejects(
          getProductFavorite(productId, secondUser.uid),
          /로그인 상태/,
        );
      },
    );

    await t.test(
      "두 사용자가 동시에 찜하면 2개로 집계하고 본인 기록만 조회한다",
      async () => {
        const secondFavorite = writeBatch(secondDb);
        secondFavorite.set(
          doc(secondDb, "users", secondUser.uid, "favorites", productId),
          { createdAt: serverTimestamp() },
        );
        secondFavorite.update(doc(secondDb, "products", productId), {
          favoriteCount: increment(1),
        });
        await Promise.all([update(true), secondFavorite.commit()]);
        assert.equal(await count(), 2);
        const favorites = await getDocs(
          collection(firebaseDb, "users", user.uid, "favorites"),
        );
        assert.deepEqual(
          favorites.docs.map((document) => document.id),
          [productId],
        );
        await update(false);
        assert.equal(await count(), 1);
      },
    );

    await t.test(
      "로그아웃 후 조회·변경을 거부하고 상품 공개 조회는 유지한다",
      async () => {
        await signOut(firebaseAuth);
        await assert.rejects(update(true), /로그인 상태/);
        await assert.rejects(
          getProductFavorite(productId, user.uid),
          /로그인 상태/,
        );
        await assert.rejects(getDocFromServer(favoriteRef), denied);
        await assert.rejects(
          updateDoc(productRef, { favoriteCount: 2 }),
          denied,
        );
        await assert.rejects(
          setDoc(favoriteRef, { createdAt: serverTimestamp() }),
          denied,
        );
        assert.equal(await count(), 1);
      },
    );
  } finally {
    hooks.deregister();
    await Promise.all([deleteApp(firebaseApp), deleteApp(secondApp)]);
  }
});
