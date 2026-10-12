import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "./productRegistrationError")
      return nextResolve(specifier + ".ts", context);
    return nextResolve(specifier, context);
  },
});
const { createProductRegistration } =
  await import("../../src/features/products/utils/createProductRegistration.ts");
hooks.deregister();

const first = new File(["first"], "first.png", { type: "image/png" });
const second = new File(["second"], "second.png", { type: "image/png" });
const input = {
  title: "상품",
  description: "설명",
  files: [first, second],
  transaction: { type: "sale", price: 1000 },
  delivery: { type: "parcel", shippingFee: 0 },
};
function setup(overrides = {}) {
  const calls = { uploaded: [], deleted: [], saved: [] };
  let nextId = 0;
  const services = {
    getUserId: async () => "owner",
    createId: () => String(++nextId),
    uploadImage: async (file) => {
      calls.uploaded.push(file);
      return {
        path: "products/owner/" + file.name,
        url: "https://example.com/" + file.name,
      };
    },
    deleteImages: async (paths, userId) => {
      calls.deleted.push({ paths, userId });
      return [];
    },
    saveProduct: async (product, userId, id) => {
      calls.saved.push({ product, userId, id });
      return id;
    },
    isDefiniteFailure: (error) => error.code === "permission-denied",
    ...overrides,
  };
  return { register: createProductRegistration(services), services, calls };
}

test("정상 등록은 사진을 순서대로 저장하고 삭제하지 않는다", async () => {
  const { register, calls } = setup();
  assert.equal(await register(input), "1");
  assert.deepEqual(calls.uploaded, [first, second]);
  assert.equal(calls.saved[0].product.images.length, 2);
  assert.equal(calls.deleted.length, 0);
});

test("뒤쪽 사진이 잘못된 형식이면 업로드 시작 전에 거부한다", async () => {
  const { register, calls } = setup();
  await assert.rejects(
    register({
      ...input,
      files: [first, new File(["svg"], "bad.svg", { type: "image/svg+xml" })],
    }),
    /JPG/,
  );
  assert.equal(calls.uploaded.length, 0);
});

test("두 번째 업로드 실패 시 첫 파일을 정리하고 수정 후 재시도한다", async () => {
  const { register, services, calls } = setup();
  const upload = services.uploadImage;
  services.uploadImage = async (file) => {
    if (file === second) throw new Error("손상 사진");
    return upload(file);
  };
  await assert.rejects(register(input), /손상 사진/);
  assert.deepEqual(calls.deleted, [
    { paths: ["products/owner/first.png"], userId: "owner" },
  ]);
  assert.equal(calls.saved.length, 0);
  assert.equal(await register({ ...input, files: [first] }), "2");
});

test("정리 실패 파일을 다음 시도에서 먼저 삭제하며 중복 업로드하지 않는다", async () => {
  const { register, services, calls } = setup();
  const upload = services.uploadImage;
  services.uploadImage = async (file) => {
    if (file === second) throw new Error("손상 사진");
    return upload(file);
  };
  let cleanupAttempts = 0;
  services.deleteImages = async (paths) => {
    cleanupAttempts++;
    return cleanupAttempts < 3 ? paths : [];
  };
  await assert.rejects(register(input), /사진 정리/);
  await assert.rejects(register({ ...input, files: [first] }), /사진 정리/);
  assert.equal(calls.uploaded.length, 1);
  await register({ ...input, files: [first] });
  assert.equal(cleanupAttempts, 3);
  assert.equal(calls.uploaded.length, 2);
});

test("명확한 상품 저장 거부는 업로드한 모든 사진을 정리한다", async () => {
  const { register, services, calls } = setup();
  services.saveProduct = async () => {
    throw Object.assign(new Error("거부"), { code: "permission-denied" });
  };
  await assert.rejects(register(input), /거부/);
  assert.equal(calls.deleted[0].paths.length, 2);
});

test("저장 응답 유실은 사진을 보존하고 동일 ID와 원래 입력으로 재시도한다", async () => {
  const { register, services, calls } = setup();
  const save = services.saveProduct;
  let attempts = 0;
  services.saveProduct = async (...args) => {
    const id = await save(...args);
    if (++attempts === 1) throw new Error("응답 유실");
    return id;
  };
  await assert.rejects(
    register(input),
    (error) => error.isAwaitingConfirmation,
  );
  assert.equal(calls.deleted.length, 0);
  assert.equal(await register({ ...input, title: "변경" }), "1");
  assert.equal(calls.uploaded.length, 2);
  assert.deepEqual(calls.saved[0], calls.saved[1]);
});

test("확인 중 로그아웃하거나 계정이 바뀌면 사진을 보존하고 복구 상태를 유지한다", async () => {
  const { register, services, calls } = setup();
  services.saveProduct = async () => {
    throw new Error("응답 유실");
  };
  await assert.rejects(
    register(input),
    (error) => error.isAwaitingConfirmation,
  );
  services.getUserId = async () => "another";
  await assert.rejects(
    register(input),
    (error) => error.isAwaitingConfirmation,
  );
  services.getUserId = async () => {
    throw new Error("로그아웃");
  };
  await assert.rejects(
    register(input),
    (error) => error.isAwaitingConfirmation,
  );
  assert.equal(calls.deleted.length, 0);
  assert.equal(calls.uploaded.length, 2);
});

test("동시에 들어온 등록 요청은 한 번만 업로드한다", async () => {
  const { register, services, calls } = setup();
  let release;
  services.getUserId = () =>
    new Promise((resolve) => {
      release = resolve;
    });
  const pending = register(input);
  await assert.rejects(register(input), /등록 중/);
  services.getUserId = async () => "owner";
  release("owner");
  await pending;
  assert.equal(calls.uploaded.length, 2);
});
