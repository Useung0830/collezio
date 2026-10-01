import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { registerHooks } from "node:module";
import test from "node:test";

import { deleteApp, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
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
import {
  connectStorageEmulator,
  deleteObject,
  ref,
  uploadBytes,
} from "firebase/storage";

test("상품 채팅방 생성 API와 비공개 규칙", async (t) => {
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
  assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST);
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
  const { firebaseApp, firebaseAuth, firebaseDb, firebaseStorage } =
    await import("../../src/lib/firebase.ts");
  const { createChatRoom } =
    await import("../../src/features/chat/api/createChatRoom.ts");
  const { getChatRoom } =
    await import("../../src/features/chat/api/getChatRoom.ts");
  const { getChatRooms } =
    await import("../../src/features/chat/api/getChatRooms.ts");
  const { sendChatMessage } =
    await import("../../src/features/chat/api/sendChatMessage.ts");
  const { getChatMessages } =
    await import("../../src/features/chat/api/getChatMessages.ts");
  const { createChatReport } =
    await import("../../src/features/chat/api/createChatReport.ts");
  const { updateChatBlock } =
    await import("../../src/features/chat/api/updateChatBlock.ts");
  const { getChatBlockStatus } =
    await import("../../src/features/chat/api/getChatBlockStatus.ts");
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
  const [storageHost, storagePort] =
    process.env.FIREBASE_STORAGE_EMULATOR_HOST.split(":");
  connectStorageEmulator(firebaseStorage, storageHost, Number(storagePort));
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

    await t.test(
      "첫 전송의 일부만 저장하려는 요청은 전체가 취소된다",
      async () => {
        const messageId = randomUUID();
        const batch = writeBatch(firebaseDb);
        const message = {
          content: "불완전한 첫 전송",
          senderId: user.uid,
          createdAt: serverTimestamp(),
        };
        batch.set(
          doc(firebaseDb, "chatRooms", roomId, "messages", messageId),
          message,
        );
        batch.update(doc(firebaseDb, "chatRooms", roomId), {
          status: "active",
          visibleTo: [user.uid, seller.uid],
          lastMessage: { id: messageId, ...message },
        });
        await assert.rejects(batch.commit(), denied);
        assert.equal((await getChatRoom(roomId, user.uid)).status, "draft");
        assert.equal((await getChatMessages(roomId, user.uid)).length, 0);
        assert.equal(
          (
            await getDocFromServer(doc(firebaseDb, "products", productId))
          ).data().chatCount ?? 0,
          0,
        );
        await assert.rejects(
          getDocFromServer(doc(sellerDb, "chatRooms", roomId)),
          denied,
        );
      },
    );

    await t.test(
      "빈 메시지와 너무 긴 메시지는 공개 전환 없이 거부된다",
      async () => {
        for (const content of ["  \n ", "a".repeat(2001)]) {
          await assert.rejects(
            sendChatMessage({
              roomId,
              userId: user.uid,
              messageId: randomUUID(),
              content,
            }),
            /메시지는/,
          );
        }
        assert.equal((await getChatRoom(roomId, user.uid)).status, "draft");
      },
    );

    await t.test(
      "동시 첫 메시지는 한 번만 공개·집계하고 같은 전송 재시도는 중복되지 않는다",
      async () => {
        const requests = Array.from({ length: 3 }, (_, index) => ({
          roomId,
          userId: user.uid,
          messageId: randomUUID(),
          content: `첫 메시지 ${index}`,
        }));
        await Promise.all(requests.map((input) => sendChatMessage(input)));
        await sendChatMessage(requests[0]);
        const messages = await getChatMessages(roomId, user.uid);
        assert.equal(messages.length, 3);
        assert.equal(new Set(messages.map((message) => message.id)).size, 3);
        const room = await getChatRoom(roomId, user.uid);
        assert.equal(room.status, "active");
        assert.ok(
          messages.some((message) => message.id === room.lastMessage.id),
        );
        assert.equal(
          (
            await getDocFromServer(doc(firebaseDb, "products", productId))
          ).data().chatCount,
          1,
        );
        const sellerRooms = await getDocs(
          query(
            collection(sellerDb, "chatRooms"),
            where("visibleTo", "array-contains", seller.uid),
          ),
        );
        assert.equal(sellerRooms.size, 1);
        assert.equal(
          (await getDocs(collection(sellerDb, "chatRooms", roomId, "messages")))
            .size,
          3,
        );
        await assert.rejects(
          sendChatMessage({ ...requests[0], content: "같은 ID로 내용 변경" }),
          /일치하지/,
        );
      },
    );

    await t.test(
      "판매자 답장과 재진입은 같은 방을 사용하고 채팅 수를 유지한다",
      async () => {
        await signInWithEmailAndPassword(
          firebaseAuth,
          seller.email,
          "Test1234!",
        );
        await sendChatMessage({
          roomId,
          userId: seller.uid,
          messageId: randomUUID(),
          content: "판매자 답장입니다.",
        });
        assert.equal(
          (await getChatRooms(seller.uid))[0].lastMessage.content,
          "판매자 답장입니다.",
        );
        assert.equal((await getChatMessages(roomId, seller.uid)).length, 4);
        await signInWithEmailAndPassword(firebaseAuth, user.email, "Test1234!");
        assert.equal(
          await createChatRoom({ productId, userId: user.uid }),
          roomId,
        );
        assert.equal(
          (await getChatMessages(roomId, user.uid)).at(-1).senderId,
          seller.uid,
        );
        assert.equal(
          (
            await getDocFromServer(doc(firebaseDb, "products", productId))
          ).data().chatCount,
          1,
        );
      },
    );

    await t.test(
      "공개된 방도 제삼자 접근·발신자 위조·메시지 수정·카운트 조작을 거부한다",
      async () => {
        await assert.rejects(
          getDocFromServer(doc(strangerDb, "chatRooms", roomId)),
          denied,
        );
        await assert.rejects(
          getDocs(collection(strangerDb, "chatRooms", roomId, "messages")),
          denied,
        );
        const messages = await getChatMessages(roomId, user.uid);
        await assert.rejects(
          updateDoc(
            doc(firebaseDb, "chatRooms", roomId, "messages", messages[0].id),
            { content: "수정" },
          ),
          denied,
        );
        await assert.rejects(
          updateDoc(doc(firebaseDb, "products", productId), { chatCount: 2 }),
          denied,
        );
        for (const overrides of [
          { senderId: seller.uid },
          { content: "  \n " },
          { content: "a".repeat(2001) },
        ]) {
          const messageId = randomUUID();
          const message = {
            senderId: user.uid,
            content: "위조 테스트",
            createdAt: serverTimestamp(),
            ...overrides,
          };
          const batch = writeBatch(firebaseDb);
          batch.set(
            doc(firebaseDb, "chatRooms", roomId, "messages", messageId),
            message,
          );
          batch.update(doc(firebaseDb, "chatRooms", roomId), {
            lastMessage: { id: messageId, ...message },
          });
          await assert.rejects(batch.commit(), denied);
        }
        assert.equal((await getChatMessages(roomId, user.uid)).length, 4);
      },
    );

    await t.test(
      "신고 재시도는 중복 생성하지 않고 타인 조회와 위조를 거부한다",
      async () => {
        const input = {
          userId: user.uid,
          partnerId: seller.uid,
          roomId,
          reportId: randomUUID(),
          reason: "사기 의심",
          details: "거래 조건 확인 요청",
        };
        await createChatReport(input);
        const ref = doc(
          firebaseDb,
          "users",
          user.uid,
          "chatReports",
          input.reportId,
        );
        const before = (await getDocFromServer(ref)).data();
        await createChatReport(input);
        assert.deepEqual((await getDocFromServer(ref)).data(), before);
        await assert.rejects(createChatReport({ ...input, details: "변조" }));
        for (const db of [sellerDb, strangerDb]) {
          await assert.rejects(
            getDocFromServer(
              doc(db, "users", user.uid, "chatReports", input.reportId),
            ),
            denied,
          );
        }
        await assert.rejects(
          createChatReport({
            ...input,
            reportId: randomUUID(),
            partnerId: stranger.uid,
          }),
          denied,
        );
        await assert.rejects(updateDoc(ref, { details: "수정" }), denied);
        await assert.rejects(
          setDoc(
            doc(firebaseDb, "users", user.uid, "chatReports", randomUUID()),
            {
              ...before,
              reason: "기타",
              details: "  ",
              createdAt: serverTimestamp(),
            },
          ),
          denied,
        );
      },
    );

    await t.test(
      "사용자 차단은 양쪽 전송과 새 방 생성을 막고 기존 대화는 보존한다",
      async () => {
        const input = { userId: user.uid, partnerId: seller.uid, roomId };
        await updateChatBlock({ ...input, isBlocked: true });
        await updateChatBlock({ ...input, isBlocked: true });
        assert.deepEqual(await getChatBlockStatus(user.uid, seller.uid), {
          isBlockedByMe: true,
          isBlockedByPartner: false,
        });
        assert.equal((await getChatMessages(roomId, user.uid)).length, 4);
        const otherProductId = await newProduct(sellerDb, seller.uid);
        const blockedRoomRef = doc(collection(firebaseDb, "chatRooms"));
        const blockedRoomBatch = writeBatch(firebaseDb);
        blockedRoomBatch.set(blockedRoomRef, {
          productId: otherProductId,
          sellerId: seller.uid,
          requesterId: user.uid,
          status: "draft",
          visibleTo: [user.uid],
          createdAt: serverTimestamp(),
        });
        blockedRoomBatch.set(
          doc(firebaseDb, "users", user.uid, "productChats", otherProductId),
          { roomId: blockedRoomRef.id },
        );
        await assert.rejects(blockedRoomBatch.commit(), denied);
        await assert.rejects(
          createChatRoom({ productId: otherProductId, userId: user.uid }),
        );
        for (const [db, senderId] of [
          [firebaseDb, user.uid],
          [sellerDb, seller.uid],
        ]) {
          const messageId = randomUUID();
          const message = {
            senderId,
            content: "차단 우회",
            createdAt: serverTimestamp(),
          };
          const batch = writeBatch(db);
          batch.set(
            doc(db, "chatRooms", roomId, "messages", messageId),
            message,
          );
          batch.update(doc(db, "chatRooms", roomId), {
            lastMessage: { id: messageId, ...message },
          });
          await assert.rejects(batch.commit(), denied);
        }
        await assert.rejects(
          getDocs(collection(sellerDb, "users", user.uid, "chatBlocks")),
          denied,
        );
        await assert.rejects(
          getDocFromServer(
            doc(strangerDb, "users", user.uid, "chatBlocks", seller.uid),
          ),
          denied,
        );
        await assert.rejects(
          updateDoc(
            doc(sellerDb, "users", user.uid, "chatBlocks", seller.uid),
            { createdAt: serverTimestamp() },
          ),
          denied,
        );
        await setDoc(
          doc(sellerDb, "users", seller.uid, "chatBlocks", user.uid),
          { createdAt: serverTimestamp() },
        );
        await updateChatBlock({ ...input, isBlocked: false });
        assert.deepEqual(await getChatBlockStatus(user.uid, seller.uid), {
          isBlockedByMe: false,
          isBlockedByPartner: true,
        });
        await assert.rejects(
          sendChatMessage({
            roomId,
            userId: user.uid,
            messageId: randomUUID(),
            content: "상호 차단",
          }),
        );
        const batch = writeBatch(sellerDb);
        batch.delete(
          doc(sellerDb, "users", seller.uid, "chatBlocks", user.uid),
        );
        await batch.commit();
        const atomicBatch = writeBatch(firebaseDb);
        const atomicMessageId = randomUUID();
        const atomicMessage = {
          senderId: user.uid,
          content: "차단과 동시 전송",
          createdAt: serverTimestamp(),
        };
        atomicBatch.set(
          doc(firebaseDb, "users", user.uid, "chatBlocks", seller.uid),
          { createdAt: serverTimestamp() },
        );
        atomicBatch.set(
          doc(firebaseDb, "chatRooms", roomId, "messages", atomicMessageId),
          atomicMessage,
        );
        atomicBatch.update(doc(firebaseDb, "chatRooms", roomId), {
          lastMessage: { id: atomicMessageId, ...atomicMessage },
        });
        await assert.rejects(atomicBatch.commit(), denied);
        await sendChatMessage({
          roomId,
          userId: user.uid,
          messageId: randomUUID(),
          content: "해제 후 전송",
        });
        assert.equal((await getChatMessages(roomId, user.uid)).length, 5);
      },
    );

    await t.test(
      "이미지와 텍스트는 순서대로 원자적으로 저장하고 재시도 시 중복되지 않는다",
      async () => {
        const imageRoomId = await createChatRoom({
          productId: await newProduct(sellerDb, seller.uid),
          userId: user.uid,
        });
        const image = new File(
          [new Uint8Array([137, 80, 78, 71])],
          "test.png",
          { type: "image/png" },
        );
        const input = {
          roomId: imageRoomId,
          userId: user.uid,
          messageId: randomUUID(),
          content: "사진 설명",
          image,
        };
        await sendChatMessage(input);
        await sendChatMessage(input);
        const messages = await getChatMessages(imageRoomId, user.uid);
        assert.equal(messages.length, 2);
        assert.equal(messages[0].id, `${input.messageId}-0`);
        assert.equal(messages[1].id, `${input.messageId}-1`);
        assert.equal(messages[0].content, "사진");
        assert.equal(messages[1].content, "사진 설명");
        assert.equal(messages[1].previousMessageId, messages[0].id);
        const path = messages[0].imagePath;
        for (const [auth, expected] of [
          [firebaseAuth, 200],
          [sellerAuth, 200],
          [strangerAuth, 403],
        ]) {
          const response = await fetch(
            `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}/v0/b/demo-collezio.appspot.com/o/${encodeURIComponent(path)}?alt=media`,
            {
              headers: {
                Authorization: `Firebase ${await auth.currentUser.getIdToken()}`,
              },
            },
          );
          assert.equal(response.status, expected);
        }
        await assert.rejects(deleteObject(ref(firebaseStorage, path)));
        await assert.rejects(
          uploadBytes(ref(firebaseStorage, path), new Uint8Array([1]), {
            contentType: "image/png",
          }),
        );
        await assert.rejects(
          sendChatMessage({
            ...input,
            image: new File([new Uint8Array([1, 2, 3, 4])], "test.png", {
              type: "image/png",
            }),
          }),
        );
        await sendChatMessage({
          ...input,
          messageId: randomUUID(),
          content: "",
        });
        assert.equal((await getChatMessages(imageRoomId, user.uid)).length, 3);
        await updateChatBlock({
          userId: user.uid,
          partnerId: seller.uid,
          roomId: imageRoomId,
          isBlocked: true,
        });
        await assert.rejects(
          sendChatMessage({ ...input, messageId: randomUUID() }),
        );
        assert.equal((await getChatMessages(imageRoomId, user.uid)).length, 3);
        await updateChatBlock({
          userId: user.uid,
          partnerId: seller.uid,
          roomId: imageRoomId,
          isBlocked: false,
        });
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
      await assert.rejects(getChatMessages(roomId, user.uid), /로그인 상태/);
      await assert.rejects(
        sendChatMessage({
          roomId,
          userId: user.uid,
          messageId: randomUUID(),
          content: "로그아웃 후 전송",
        }),
        /로그인 상태/,
      );
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
