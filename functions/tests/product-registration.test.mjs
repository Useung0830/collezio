import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { deleteApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

import {
  cancelProductRegistration,
  cleanExpiredProductRegistrations,
  cleanProductRegistration,
} from "../src/cleanupProductRegistrations.js";
import {
  acknowledgeProductRegistration,
  beginProductRegistration,
  completeProductRegistration,
  getProductRegistration,
} from "../src/manageProductRegistration.js";
import { hashBuffer } from "../src/productRegistrationData.js";
import { saveProductImage } from "../src/saveProductImage.js";

const product = {
  title: "원피스 피규어",
  description: "상품 설명",
  category: "figure",
  transaction: { type: "sale", price: 10000 },
  delivery: { type: "parcel", shippingFee: 0 },
};
test("서버 등록 작업의 복구·경합·만료 정리", async (t) => {
  assert.equal(process.env.GCLOUD_PROJECT, "demo-collezio");
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080");
  assert.equal(process.env.FIREBASE_STORAGE_EMULATOR_HOST, "127.0.0.1:9199");
  assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, "127.0.0.1:9099");
  const app = initializeApp(
    { projectId: "demo-collezio", storageBucket: "demo-collezio.appspot.com" },
    randomUUID(),
  );
  const db = getFirestore(app),
    auth = getAuth(app),
    bucket = getStorage(app).bucket();
  const user = await auth.createUser({ uid: randomUUID() });
  const other = await auth.createUser({ uid: randomUUID() });
  const services = { db, auth, bucket };
  const bytes = await readFile(
    new URL(
      "../../src/assets/images/product-luffy-cutout.png",
      import.meta.url,
    ),
  );
  const attempts = [];
  const begin = async () => {
    const registrationId = randomUUID(),
      imageId = randomUUID();
    const input = {
      registrationId,
      product,
      files: [
        {
          id: imageId,
          name: "figure.png",
          contentType: "image/png",
          size: bytes.length,
          sha256: hashBuffer(bytes),
        },
      ],
    };
    const payload = {
      registrationId,
      imageId,
      base64: bytes.toString("base64"),
      contentType: "image/png",
    };
    attempts.push(registrationId);
    await beginProductRegistration(services, user.uid, input);
    return {
      input,
      payload,
      ref: db.doc("productRegistrations/" + registrationId),
    };
  };
  const cancel = (id) =>
    cancelProductRegistration(services, user.uid, { registrationId: id });
  try {
    await db.doc("profiles/" + user.uid).set({ nickname: "테스터" });
    await t.test(
      "동일 작업 시작 재시도는 같은 기록이며 다른 내용·다른 사용자·병행 작업을 거부한다",
      async () => {
        const { input } = await begin();
        assert.equal(
          (await beginProductRegistration(services, user.uid, input)).id,
          input.registrationId,
        );
        await assert.rejects(
          beginProductRegistration(services, user.uid, {
            ...input,
            product: { ...product, title: "다름" },
          }),
          { code: "already-exists" },
        );
        await assert.rejects(
          beginProductRegistration(services, user.uid, {
            ...input,
            registrationId: randomUUID(),
          }),
          { code: "already-exists" },
        );
        await assert.rejects(
          getProductRegistration(services, other.uid, {
            registrationId: input.registrationId,
          }),
          { code: "permission-denied" },
        );
        await assert.rejects(beginProductRegistration(services, null, input), {
          code: "unauthenticated",
        });
        assert.equal(
          (
            await getProductRegistration(services, user.uid, {
              registrationId: null,
            })
          ).id,
          input.registrationId,
        );
        await cancel(input.registrationId);
      },
    );
    await t.test(
      "업로드 응답 유실 후 동일 사진 재전송은 같은 파일·토큰을 반환한다",
      async () => {
        const { input, payload } = await begin();
        const first = await saveProductImage(services, user.uid, payload);
        assert.deepEqual(
          await saveProductImage(services, user.uid, payload),
          first,
        );
        assert.equal(
          (await bucket.getFiles({ prefix: first.path }))[0].length,
          1,
        );
        await assert.rejects(
          saveProductImage(services, user.uid, {
            ...payload,
            base64: Buffer.from("different").toString("base64"),
          }),
          { code: "invalid-argument" },
        );
        await cancel(input.registrationId);
        assert.equal((await bucket.file(first.path).exists())[0], false);
      },
    );
    await t.test(
      "Storage 저장 후 작업 기록에 실패해도 기존 파일을 재사용한다",
      async () => {
        const { input, payload, ref } = await begin();
        let count = 0;
        const failingDb = {
          doc: db.doc.bind(db),
          runTransaction: (...args) =>
            ++count === 2
              ? Promise.reject(new Error("lost acknowledgement"))
              : db.runTransaction(...args),
        };
        await assert.rejects(
          saveProductImage({ ...services, db: failingDb }, user.uid, payload),
          /lost acknowledgement/,
        );
        const path = (await ref.get()).get("files")[0].path;
        const [before] = await bucket.file(path).getMetadata();
        await saveProductImage(services, user.uid, payload);
        const [after] = await bucket.file(path).getMetadata();
        assert.equal(before.generation, after.generation);
        await cancel(input.registrationId);
      },
    );
    await t.test(
      "등록 확정 재시도와 동시 요청은 상품 하나만 만들고 정리 대상에서 제외한다",
      async () => {
        const { input, payload, ref } = await begin();
        await assert.rejects(
          completeProductRegistration(services, user.uid, {
            registrationId: input.registrationId,
          }),
          { code: "failed-precondition" },
        );
        const image = await saveProductImage(services, user.uid, payload);
        const results = await Promise.all(
          [1, 2].map(() =>
            completeProductRegistration(services, user.uid, {
              registrationId: input.registrationId,
            }),
          ),
        );
        assert.deepEqual(results, [
          { productId: input.registrationId },
          { productId: input.registrationId },
        ]);
        const savedProduct = await db
          .doc("products/" + input.registrationId)
          .get();
        assert.equal(savedProduct.get("category"), "figure");
        assert.ok(savedProduct.get("titleTerms").includes("피규어"));
        const searchResults = await db
          .collection("products")
          .where("category", "==", "figure")
          .where("titleTerms", "array-contains", "피규어")
          .orderBy("createdAt", "desc")
          .get();
        assert.ok(
          searchResults.docs.some(
            (document) => document.id === input.registrationId,
          ),
        );
        const otherCategory = await db
          .collection("products")
          .where("category", "==", "plush")
          .where("titleTerms", "array-contains", "피규어")
          .orderBy("createdAt", "desc")
          .get();
        assert.ok(
          !otherCategory.docs.some(
            (document) => document.id === input.registrationId,
          ),
        );
        assert.equal((await ref.get()).get("status"), "committed");
        assert.equal((await ref.get()).get("cleanupAt"), undefined);
        assert.equal(
          (
            await getProductRegistration(services, user.uid, {
              registrationId: null,
            })
          ).status,
          "committed",
        );
        await assert.rejects(
          acknowledgeProductRegistration(services, other.uid, {
            registrationId: input.registrationId,
          }),
          { code: "permission-denied" },
        );
        await acknowledgeProductRegistration(services, user.uid, {
          registrationId: input.registrationId,
        });
        assert.equal(
          await getProductRegistration(services, user.uid, {
            registrationId: null,
          }),
          null,
        );
        assert.equal(
          (
            await completeProductRegistration(services, user.uid, {
              registrationId: input.registrationId,
            })
          ).productId,
          input.registrationId,
        );
        await assert.rejects(cancel(input.registrationId), {
          code: "failed-precondition",
        });
        await cleanProductRegistration(services, input.registrationId);
        assert.equal((await bucket.file(image.path).exists())[0], true);
      },
    );
    await t.test(
      "창 종료 후 만료 작업은 삭제되며 정리 실패를 다음 실행에서 재시도한다",
      async () => {
        const { input, payload, ref } = await begin();
        const image = await saveProductImage(services, user.uid, payload);
        await ref.update({
          expiresAt: Timestamp.fromMillis(0),
          cleanupAt: Timestamp.fromMillis(0),
        });
        await assert.rejects(
          cleanProductRegistration(
            {
              ...services,
              bucket: {
                file: () => ({
                  delete: async () => {
                    throw new Error("storage unavailable");
                  },
                }),
              },
            },
            input.registrationId,
          ),
        );
        assert.equal((await ref.get()).get("status"), "cleaning");
        await ref.update({
          cleanupAt: Timestamp.fromMillis(0),
          cleanupAfter: Timestamp.fromMillis(0),
        });
        await cleanExpiredProductRegistrations(services);
        assert.equal((await bucket.file(image.path).exists())[0], false);
        assert.equal((await ref.get()).get("status"), "cleaned");
        await assert.rejects(saveProductImage(services, user.uid, payload), {
          code: "failed-precondition",
        });
      },
    );
    await t.test(
      "등록 확정과 취소 경합에서 게시된 사진은 삭제되지 않는다",
      async () => {
        const { input, payload, ref } = await begin();
        const image = await saveProductImage(services, user.uid, payload);
        await Promise.allSettled([
          completeProductRegistration(services, user.uid, {
            registrationId: input.registrationId,
          }),
          cancel(input.registrationId),
        ]);
        const status = (await ref.get()).get("status");
        const exists = (await db.doc("products/" + input.registrationId).get())
          .exists;
        assert.equal(exists, status === "committed");
        assert.equal((await bucket.file(image.path).exists())[0], exists);
      },
    );
    await t.test(
      "정리 시작 전에 실행 중이던 업로드가 늦게 저장돼도 파일을 회수한다",
      async () => {
        const { input, payload, ref } = await begin();
        let release, signal;
        const saved = new Promise((resolve) => {
          signal = resolve;
        });
        const gate = new Promise((resolve) => {
          release = resolve;
        });
        const delayedBucket = {
          name: bucket.name,
          file: (path) => {
            const file = bucket.file(path);
            return {
              getMetadata: file.getMetadata.bind(file),
              delete: file.delete.bind(file),
              save: async (...args) => {
                signal();
                await gate;
                return file.save(...args);
              },
            };
          },
        };
        const upload = saveProductImage(
          { ...services, bucket: delayedBucket },
          user.uid,
          payload,
        );
        const observed = assert.rejects(upload, {
          code: "failed-precondition",
        });
        await saved;
        await cancel(input.registrationId);
        release();
        await observed;
        const path = (await ref.get()).get("files")[0].path;
        assert.equal((await bucket.file(path).exists())[0], false);
      },
    );
    await t.test("탈퇴 접수 후 새 등록·업로드·확정을 거부한다", async () => {
      const { input, payload } = await begin();
      await db
        .doc("withdrawalRequests/" + user.uid)
        .set({ status: "processing" });
      await assert.rejects(saveProductImage(services, user.uid, payload), {
        code: "permission-denied",
      });
      await assert.rejects(
        completeProductRegistration(services, user.uid, {
          registrationId: input.registrationId,
        }),
        { code: "permission-denied" },
      );
      await assert.rejects(
        beginProductRegistration(services, user.uid, input),
        { code: "permission-denied" },
      );
    });
  } finally {
    await bucket.deleteFiles({ prefix: "products/" + user.uid + "/" });
    for (const id of attempts) {
      await db.doc("productRegistrations/" + id).delete();
      await db.doc("products/" + id).delete();
    }
    await db.doc("productRegistrationOwners/" + user.uid).delete();
    await db.doc("profiles/" + user.uid).delete();
    await db.doc("withdrawalRequests/" + user.uid).delete();
    await auth.deleteUser(user.uid);
    await auth.deleteUser(other.uid);
    await deleteApp(app);
  }
});
