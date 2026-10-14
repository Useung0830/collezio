import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createRequire, registerHooks } from "node:module";
import test from "node:test";

import { deleteApp, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getDocFromServer,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

const requireFunctions = createRequire(
  new URL("../../functions/package.json", import.meta.url),
);
const { initializeApp: initializeAdmin, deleteApp: deleteAdmin } =
  requireFunctions("firebase-admin/app");
const { getFirestore: getAdminFirestore } = requireFunctions(
  "firebase-admin/firestore",
);

test("거래 완료와 상호 후기 공개 규칙", async (t) => {
  assert.ok(
    process.env.FIRESTORE_EMULATOR_HOST &&
      process.env.FIREBASE_AUTH_EMULATOR_HOST,
  );
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "demo-collezio";
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "demo-key";
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "demo-collezio.appspot.com";
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === "client-only")
        return { url: "data:text/javascript,export {};", shortCircuit: true };
      if (specifier.startsWith("@/"))
        return nextResolve(
          new URL(`../../src/${specifier.slice(2)}.ts`, import.meta.url).href,
          context,
        );
      return nextResolve(specifier, context);
    },
  });
  const { firebaseApp, firebaseAuth, firebaseDb } =
    await import("../../src/lib/firebase.ts");
  const { updateTradeCompletion } =
    await import("../../src/features/chat/api/updateTradeCompletion.ts");
  const { createTradeReview } =
    await import("../../src/features/chat/api/createTradeReview.ts");
  const { createTradeProposal } =
    await import("../../src/features/chat/api/createTradeProposal.ts");
  const { runTradeCompletionTransaction } =
    await import("../../src/features/chat/api/runTradeCompletionTransaction.ts");
  const adminApp = initializeAdmin(
    { projectId: "demo-collezio" },
    randomUUID(),
  );
  const admin = getAdminFirestore(adminApp);
  const sellerApp = initializeApp(
    { projectId: "demo-collezio", apiKey: "demo-key" },
    randomUUID(),
  );
  const strangerApp = initializeApp(
    { projectId: "demo-collezio", apiKey: "demo-key" },
    randomUUID(),
  );
  const sellerAuth = getAuth(sellerApp),
    sellerDb = getFirestore(sellerApp);
  const strangerAuth = getAuth(strangerApp),
    strangerDb = getFirestore(strangerApp);
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(":");
  for (const [auth, db] of [
    [firebaseAuth, firebaseDb],
    [sellerAuth, sellerDb],
    [strangerAuth, strangerDb],
  ]) {
    connectAuthEmulator(
      auth,
      `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`,
      { disableWarnings: true },
    );
    connectFirestoreEmulator(db, host, Number(port));
  }
  const register = (auth) =>
    createUserWithEmailAndPassword(
      auth,
      `${randomUUID()}@example.com`,
      "Test1234!",
    );
  const denied = (error) => error.code === "permission-denied";
  try {
    const { user: buyer } = await register(firebaseAuth);
    const { user: seller } = await register(sellerAuth);
    await register(strangerAuth);
    const login = (user) =>
      signInWithEmailAndPassword(firebaseAuth, user.email, "Test1234!");
    const seed = async ({
      kind = "sale",
      scheduledAt = Date.now() - 10000,
      pendingId = null,
    } = {}) => {
      await login(buyer);
      const roomId = randomUUID(),
        proposalId = randomUUID(),
        productId = randomUUID();
      const exchangeProductId = kind === "exchange" ? randomUUID() : null;
      const base = `chatRooms/${roomId}`;
      const terms = {
        kind,
        amount: kind === "sale" ? 12000 : 0,
        exchangeProductId,
        extraAmount: 0,
        extraPayer: "none",
        method: "parcel",
        scheduledAt,
        location: "",
        shippingPayer: "each",
        notes: "",
      };
      const batch = admin.batch();
      batch.set(admin.doc(base), {
        productId,
        requesterId: buyer.uid,
        sellerId: seller.uid,
        visibleTo: [buyer.uid, seller.uid],
        status: "active",
      });
      batch.set(admin.doc(`${base}/trade/state`), {
        acceptedId: proposalId,
        pendingId,
      });
      batch.set(admin.doc(`${base}/proposals/${proposalId}`), {
        status: "accepted",
        productId,
        senderId: buyer.uid,
        recipientId: seller.uid,
        previousId: null,
        terms,
      });
      batch.set(admin.doc(`products/${productId}`), {
        sellerId: seller.uid,
        status: "reserved",
        reservedByRoomId: roomId,
        transaction: { type: kind, price: 12000 },
      });
      if (exchangeProductId)
        batch.set(admin.doc(`products/${exchangeProductId}`), {
          sellerId: buyer.uid,
          status: "reserved",
          reservedByRoomId: roomId,
        });
      await batch.commit();
      return {
        roomId,
        proposalId,
        productId,
        exchangeProductId,
        terms,
        completionPath: `${base}/completions/${proposalId}`,
      };
    };
    const completeBoth = async (trade) => {
      await updateTradeCompletion(
        trade.roomId,
        buyer.uid,
        trade.proposalId,
        true,
      );
      await login(seller);
      await updateTradeCompletion(
        trade.roomId,
        seller.uid,
        trade.proposalId,
        true,
      );
      await login(buyer);
    };
    const payload = (confirmedBy = [], deferredBy = []) => ({
      confirmedBy,
      deferredBy,
      reviewedBy: [],
      updatedAt: serverTimestamp(),
    });

    await t.test(
      "시간 전·조건 변경 대기·제삼자의 완료와 대리 확인은 거부한다",
      async () => {
        const future = await seed({ scheduledAt: Date.now() + 60000 });
        await assert.rejects(
          updateTradeCompletion(
            future.roomId,
            buyer.uid,
            future.proposalId,
            true,
          ),
          /시간/,
        );
        await assert.rejects(
          setDoc(doc(firebaseDb, future.completionPath), payload([buyer.uid])),
          denied,
        );
        const pending = await seed({ pendingId: randomUUID() });
        await assert.rejects(
          updateTradeCompletion(
            pending.roomId,
            buyer.uid,
            pending.proposalId,
            true,
          ),
          /조건 변경/,
        );
        await assert.rejects(
          setDoc(doc(firebaseDb, pending.completionPath), payload([buyer.uid])),
          denied,
        );
        const trade = await seed();
        await assert.rejects(
          setDoc(doc(strangerDb, trade.completionPath), payload([buyer.uid])),
          denied,
        );
        await assert.rejects(
          setDoc(doc(firebaseDb, trade.completionPath), payload([seller.uid])),
          denied,
        );
        await assert.rejects(
          setDoc(
            doc(firebaseDb, trade.completionPath),
            payload([buyer.uid, seller.uid]),
          ),
          denied,
        );
      },
    );

    await t.test(
      "아직이에요는 유지되며 한쪽 완료만으로는 후기를 쓸 수 없다",
      async () => {
        const trade = await seed();
        await updateTradeCompletion(
          trade.roomId,
          buyer.uid,
          trade.proposalId,
          false,
        );
        assert.deepEqual(
          (await getDocFromServer(doc(firebaseDb, trade.completionPath))).data()
            .deferredBy,
          [buyer.uid],
        );
        await updateTradeCompletion(
          trade.roomId,
          buyer.uid,
          trade.proposalId,
          true,
        );
        await updateTradeCompletion(
          trade.roomId,
          buyer.uid,
          trade.proposalId,
          true,
        );
        const completion = (
          await getDocFromServer(doc(firebaseDb, trade.completionPath))
        ).data();
        assert.deepEqual(completion.confirmedBy, [buyer.uid]);
        assert.deepEqual(completion.deferredBy, []);
        assert.equal(
          (await admin.doc(`products/${trade.productId}`).get()).get("status"),
          "reserved",
        );
        await assert.rejects(
          createTradeReview(trade.roomId, buyer.uid, trade.proposalId, {
            rating: 5,
            content: "좋았어요",
          }),
          /두 분/,
        );
        await assert.rejects(
          setDoc(
            doc(firebaseDb, `${trade.completionPath}/reviews/${buyer.uid}`),
            { rating: 5, content: "미리 작성", createdAt: serverTimestamp() },
          ),
          denied,
        );
        await assert.rejects(
          updateDoc(doc(firebaseDb, trade.completionPath), {
            confirmedBy: [],
            updatedAt: serverTimestamp(),
          }),
          denied,
        );
      },
    );

    await t.test(
      "구매·교환 양쪽 완료 시 모든 거래 상품을 완료하고 조건 변경을 차단한다",
      async () => {
        for (const kind of ["sale", "exchange"]) {
          const trade = await seed({ kind });
          await completeBoth(trade);
          const completion = (
            await getDocFromServer(doc(firebaseDb, trade.completionPath))
          ).data();
          assert.deepEqual(
            new Set(completion.confirmedBy),
            new Set([buyer.uid, seller.uid]),
          );
          for (const id of [trade.productId, trade.exchangeProductId].filter(
            Boolean,
          ))
            assert.equal(
              (await admin.doc(`products/${id}`).get()).get("status"),
              "completed",
            );
          await assert.rejects(
            createTradeProposal(
              trade.roomId,
              buyer.uid,
              randomUUID(),
              { ...trade.terms, scheduledAt: Date.now() + 60000 },
              trade.proposalId,
            ),
            /완료된 거래/,
          );
        }
      },
    );

    await t.test(
      "한쪽 후기는 API 조회·목록 조회 모두 숨기고 두 번째 제출과 동시에 공개한다",
      async () => {
        const trade = await seed();
        await completeBoth(trade);
        const review = { rating: 4, content: "친절하게 거래했어요" };
        await createTradeReview(
          trade.roomId,
          buyer.uid,
          trade.proposalId,
          review,
        );
        await createTradeReview(
          trade.roomId,
          buyer.uid,
          trade.proposalId,
          review,
        );
        const buyerPath = `${trade.completionPath}/reviews/${buyer.uid}`;
        const sellerPath = `${trade.completionPath}/reviews/${seller.uid}`;
        assert.equal(
          (await getDocFromServer(doc(firebaseDb, buyerPath))).data().rating,
          4,
        );
        await assert.rejects(
          getDocFromServer(doc(sellerDb, buyerPath)),
          denied,
        );
        await assert.rejects(
          getDocs(collection(sellerDb, `${trade.completionPath}/reviews`)),
          denied,
        );
        await assert.rejects(
          updateDoc(doc(sellerDb, trade.completionPath), {
            reviewedBy: [buyer.uid, seller.uid],
            updatedAt: serverTimestamp(),
          }),
          denied,
        );
        await login(seller);
        await createTradeReview(trade.roomId, seller.uid, trade.proposalId, {
          rating: 5,
          content: "감사합니다",
        });
        assert.equal(
          (await getDocFromServer(doc(sellerDb, buyerPath))).data().content,
          review.content,
        );
        await login(buyer);
        assert.equal(
          (await getDocFromServer(doc(firebaseDb, sellerPath))).data().rating,
          5,
        );
        await assert.rejects(
          getDocFromServer(doc(strangerDb, buyerPath)),
          denied,
        );
        await assert.rejects(
          updateDoc(doc(firebaseDb, buyerPath), { rating: 1 }),
          denied,
        );
        await assert.rejects(
          createTradeReview(trade.roomId, buyer.uid, trade.proposalId, {
            rating: 1,
            content: "변경",
          }),
          /이미 작성/,
        );
      },
    );

    await t.test(
      "유효하지 않은 평점·빈 후기·후기 작성자 위조를 거부한다",
      async () => {
        const trade = await seed();
        await completeBoth(trade);
        for (const review of [
          { rating: 0, content: "후기" },
          { rating: 6, content: "후기" },
          { rating: 1.5, content: "후기" },
          { rating: 5, content: "  " },
          { rating: 5, content: "x".repeat(1001) },
        ]) {
          const batch = writeBatch(firebaseDb);
          batch.set(
            doc(firebaseDb, `${trade.completionPath}/reviews/${buyer.uid}`),
            { ...review, createdAt: serverTimestamp() },
          );
          batch.update(doc(firebaseDb, trade.completionPath), {
            reviewedBy: [buyer.uid],
            updatedAt: serverTimestamp(),
          });
          await assert.rejects(batch.commit(), denied);
        }
        await assert.rejects(
          setDoc(
            doc(firebaseDb, `${trade.completionPath}/reviews/${seller.uid}`),
            { rating: 5, content: "대신 작성", createdAt: serverTimestamp() },
          ),
          denied,
        );
      },
    );

    await t.test(
      "동시 완료와 동시 후기 제출에서도 양쪽 응답을 보존한다",
      async () => {
        const trade = await seed();
        const completionRef = doc(sellerDb, trade.completionPath);
        const sellerConfirm = () =>
          runTradeCompletionTransaction(completionRef, async (tx, snapshot) => {
            const ref = doc(sellerDb, trade.completionPath);
            const before = snapshot.data() ?? payload();
            if (before.confirmedBy.includes(seller.uid)) return;
            const confirmedBy = [...before.confirmedBy, seller.uid];
            tx.set(ref, {
              ...before,
              confirmedBy,
              updatedAt: serverTimestamp(),
            });
            if (confirmedBy.length === 2)
              tx.update(doc(sellerDb, "products", trade.productId), {
                status: "completed",
              });
          });
        await Promise.all([
          updateTradeCompletion(
            trade.roomId,
            buyer.uid,
            trade.proposalId,
            true,
          ),
          sellerConfirm(),
        ]);
        const sellerReview = () =>
          runTradeCompletionTransaction(completionRef, async (tx, snapshot) => {
            const ref = doc(sellerDb, trade.completionPath);
            const before = snapshot.data();
            tx.set(doc(ref, "reviews", seller.uid), {
              rating: 5,
              content: "판매자 후기",
              createdAt: serverTimestamp(),
            });
            tx.update(ref, {
              reviewedBy: [...before.reviewedBy, seller.uid],
              updatedAt: serverTimestamp(),
            });
          });
        await Promise.all([
          createTradeReview(trade.roomId, buyer.uid, trade.proposalId, {
            rating: 4,
            content: "구매자 후기",
          }),
          sellerReview(),
        ]);
        assert.equal(
          (await getDocFromServer(doc(firebaseDb, trade.completionPath))).data()
            .reviewedBy.length,
          2,
        );
        assert.equal(
          (
            await getDocFromServer(
              doc(firebaseDb, `${trade.completionPath}/reviews/${seller.uid}`),
            )
          ).data().rating,
          5,
        );
      },
    );
  } finally {
    hooks.deregister();
    await Promise.all([
      deleteApp(firebaseApp),
      deleteApp(sellerApp),
      deleteApp(strangerApp),
      deleteAdmin(adminApp),
    ]);
  }
});
