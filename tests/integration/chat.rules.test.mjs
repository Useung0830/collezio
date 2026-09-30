import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { registerHooks } from "node:module";
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
  getDocFromServer,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

test("상품 채팅방 생성 API와 비공개 규칙", async (t) => {
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
  assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST);
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "demo-collezio";
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "demo-key";
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
  const { createChatRoom } =
    await import("../../src/features/chat/api/createChatRoom.ts");
  const { getChatRoom } =
    await import("../../src/features/chat/api/getChatRoom.ts");
  const { getChatRooms } =
    await import("../../src/features/chat/api/getChatRooms.ts");
  const sellerApp = initializeApp(
    { projectId: "demo-collezio", apiKey: "demo-key" },
    "chat-seller",
  );
  const strangerApp = initializeApp(
    { projectId: "demo-collezio", apiKey: "demo-key" },
    "chat-stranger",
  );
  const sellerAuth = getAuth(sellerApp);
  const sellerDb = getFirestore(sellerApp);
  const strangerAuth = getAuth(strangerApp);
  const strangerDb = getFirestore(strangerApp);
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
  const denied = (error) => error.code === "permission-denied";
  const register = (auth) =>
    createUserWithEmailAndPassword(
      auth,
      `${randomUUID()}@example.com`,
      "Test1234!",
    );
  const newProduct = (db, sellerId) => {
    const ref = doc(collection(db, "products"));
    return setDoc(ref, {
      title: "채팅 테스트 상품",
      description: "상품별 채팅 확인",
      sellerId,
      status: "available",
      transaction: { type: "sale", price: 12000 },
      delivery: { type: "parcel", shippingFee: 0 },
      images: [
        { url: "https://example.com/product.png", path: "test/product" },
      ],
      favoriteCount: 0,
      createdAt: serverTimestamp(),
    }).then(() => ref.id);
  };
  try {
    const { user } = await register(firebaseAuth);
    const { user: seller } = await register(sellerAuth);
    const { user: stranger } = await register(strangerAuth);
    const productId = await newProduct(sellerDb, seller.uid);
    await setDoc(doc(sellerDb, "profiles", seller.uid), {
      nickname: "채팅 판매자",
      imageUrl: null,
      bio: "",
      createdAt: serverTimestamp(),
    });
    let roomId;

    await t.test(
      "동시 요청과 재진입은 한 방만 생성하고 생성 시각을 유지한다",
      async () => {
        const ids = await Promise.all(
          Array.from({ length: 4 }, () =>
            createChatRoom({ productId, userId: user.uid }),
          ),
        );
        assert.equal(new Set(ids).size, 1);
        roomId = ids[0];
        const before = await getChatRoom(roomId, user.uid);
        assert.equal(
          await createChatRoom({ productId, userId: user.uid }),
          roomId,
        );
        const rooms = await getChatRooms(user.uid);
        assert.equal(rooms.length, 1);
        assert.equal(rooms[0].createdAt, before.createdAt);
        assert.equal(rooms[0].partnerName, "채팅 판매자");
        assert.equal(rooms[0].productTitle, "채팅 테스트 상품");
        assert.equal(rooms[0].status, "draft");
        const product = (
          await getDocFromServer(doc(firebaseDb, "products", productId))
        ).data();
        assert.equal(product.chatCount ?? 0, 0);
        assert.equal(product.favoriteCount, 0);
      },
    );

    await t.test(
      "판매자와 제삼자는 목록에서 볼 수 없고 URL로 직접 조회해도 거부된다",
      async () => {
        for (const [db, uid] of [
          [sellerDb, seller.uid],
          [strangerDb, stranger.uid],
        ]) {
          const result = await getDocs(
            query(
              collection(db, "chatRooms"),
              where("visibleTo", "array-contains", uid),
            ),
          );
          assert.equal(result.size, 0);
          await assert.rejects(
            getDocFromServer(doc(db, "chatRooms", roomId)),
            denied,
          );
          await assert.rejects(
            getDocFromServer(
              doc(db, "users", user.uid, "productChats", productId),
            ),
            denied,
          );
        }
        await assert.rejects(
          getDocs(collection(firebaseDb, "chatRooms")),
          denied,
        );
      },
    );

    await t.test("다른 상품은 별도 방을 사용한다", async () => {
      const otherProductId = await newProduct(sellerDb, seller.uid);
      assert.notEqual(
        await createChatRoom({ productId: otherProductId, userId: user.uid }),
        roomId,
      );
      assert.equal((await getChatRooms(user.uid)).length, 2);
    });

    await t.test("내 상품과 없는 상품에는 채팅방을 만들 수 없다", async () => {
      const ownProductId = await newProduct(firebaseDb, user.uid);
      await assert.rejects(
        createChatRoom({ productId: ownProductId, userId: user.uid }),
        /내 상품/,
      );
      await assert.rejects(
        createChatRoom({ productId: "missing-product", userId: user.uid }),
        /상품 또는 판매자/,
      );
    });

    await t.test(
      "공개 대상 변경, 단독 생성, 연결 기록 변조와 메시지 쓰기를 거부한다",
      async () => {
        const roomRef = doc(firebaseDb, "chatRooms", roomId);
        await assert.rejects(
          updateDoc(roomRef, { visibleTo: [user.uid, seller.uid] }),
          denied,
        );
        await assert.rejects(updateDoc(roomRef, { status: "active" }), denied);
        await assert.rejects(
          setDoc(doc(collection(roomRef, "messages")), {
            content: "임의 메시지",
            senderId: user.uid,
          }),
          denied,
        );
        await assert.rejects(
          setDoc(
            doc(firebaseDb, "users", user.uid, "productChats", "fake-product"),
            { roomId },
          ),
          denied,
        );
        await assert.rejects(
          updateDoc(
            doc(firebaseDb, "users", user.uid, "productChats", productId),
            { roomId: "fake-room" },
          ),
          denied,
        );
        await assert.rejects(
          setDoc(doc(collection(firebaseDb, "chatRooms")), {
            productId,
            sellerId: seller.uid,
            requesterId: user.uid,
            visibleTo: [user.uid],
            status: "draft",
            createdAt: serverTimestamp(),
          }),
          denied,
        );
      },
    );

    await t.test(
      "직접 조작한 판매자·공개 대상·중복 연결을 규칙에서 거부한다",
      async () => {
        const extraProduct = await newProduct(sellerDb, seller.uid);
        for (const [targetProduct, overrides] of [
          [extraProduct, { sellerId: stranger.uid }],
          [extraProduct, { visibleTo: [user.uid, seller.uid] }],
          [extraProduct, { requesterId: stranger.uid }],
          [productId, {}],
        ]) {
          const room = doc(collection(firebaseDb, "chatRooms"));
          const batch = writeBatch(firebaseDb);
          batch.set(
            doc(firebaseDb, "users", user.uid, "productChats", targetProduct),
            { roomId: room.id },
          );
          batch.set(room, {
            productId: targetProduct,
            sellerId: seller.uid,
            requesterId: user.uid,
            visibleTo: [user.uid],
            status: "draft",
            createdAt: serverTimestamp(),
            ...overrides,
          });
          await assert.rejects(batch.commit(), denied);
        }
      },
    );

    await t.test("로그아웃 후 이전 사용자 데이터 요청을 차단한다", async () => {
      await signOut(firebaseAuth);
      await assert.rejects(
        createChatRoom({ productId, userId: user.uid }),
        /로그인 상태/,
      );
      await assert.rejects(getChatRooms(user.uid), /로그인 상태/);
      await assert.rejects(getChatRoom(roomId, user.uid), /로그인 상태/);
      await assert.rejects(
        getDocFromServer(doc(firebaseDb, "chatRooms", roomId)),
        denied,
      );
    });
  } finally {
    hooks.deregister();
    await Promise.all([
      deleteApp(firebaseApp),
      deleteApp(sellerApp),
      deleteApp(strangerApp),
    ]);
  }
});
