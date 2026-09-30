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
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

test("커뮤니티: 공개 조회, 작성자 권한, 입력 검증, 좋아요 원자성", async (t) => {
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST);
  assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST);
  const app = initializeApp(
    { projectId: "demo-collezio", apiKey: "demo-key" },
    "community-rules",
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
  const post = doc(collection(db, "communityPosts"));
  const comment = doc(collection(db, "communityComments"));
  const stamp = () => ({
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  try {
    const { user: owner } = await createUserWithEmailAndPassword(
      auth,
      `community-owner-${Date.now()}@example.com`,
      "Test-password-123!",
    );
    const data = {
      authorId: owner.uid,
      title: "제목",
      content: "본문\n둘째 줄",
      images: [],
      likeCount: 0,
      viewCount: 0,
    };
    await t.test(
      "빈 글·과도한 길이·위조 필드·클라이언트 시간 거부",
      async () => {
        for (const invalid of [
          { title: " \n\t" },
          { content: "" },
          { title: "가".repeat(101) },
          { content: "가".repeat(5001) },
          { authorId: "other" },
          { likeCount: 1 },
          { viewCount: 1 },
          { extra: true },
          { images: [{ url: "https://example.com" }] },
          { createdAt: new Date(0) },
        ])
          await assert.rejects(
            setDoc(post, { ...data, ...stamp(), ...invalid }),
            denied,
          );
        await setDoc(post, { ...data, ...stamp() });
      },
    );
    await t.test(
      "본인 수정 및 댓글 생성 허용, 작성자·생성시각·카운터 변경 거부",
      async () => {
        await updateDoc(post, {
          title: "수정 제목",
          updatedAt: serverTimestamp(),
        });
        for (const invalid of [
          { authorId: "other" },
          { createdAt: new Date(0) },
          { likeCount: 10 },
          { viewCount: 10 },
        ]) {
          await assert.rejects(updateDoc(post, invalid), denied);
        }
        const commentData = {
          postId: post.id,
          authorId: owner.uid,
          content: "댓글",
        };
        for (const invalid of [
          { postId: "missing" },
          { authorId: "other" },
          { content: " " },
          { content: "가".repeat(1001) },
          { extra: true },
        ]) {
          await assert.rejects(
            setDoc(comment, { ...commentData, ...stamp(), ...invalid }),
            denied,
          );
        }
        await setDoc(comment, { ...commentData, ...stamp() });
        await updateDoc(comment, {
          content: "수정 댓글",
          updatedAt: serverTimestamp(),
        });
        await assert.rejects(updateDoc(comment, { postId: "missing" }), denied);
        await assert.rejects(deleteDoc(post), denied);
      },
    );
    const { user: other } = await createUserWithEmailAndPassword(
      auth,
      `community-other-${Date.now()}@example.com`,
      "Test-password-123!",
    );
    await t.test("타인의 글·댓글 수정 및 삭제 거부", async () => {
      await assert.rejects(
        updateDoc(post, { title: "위조", updatedAt: serverTimestamp() }),
        denied,
      );
      await assert.rejects(deleteDoc(post), denied);
      await assert.rejects(
        updateDoc(comment, { content: "위조", updatedAt: serverTimestamp() }),
        denied,
      );
      await assert.rejects(deleteDoc(comment), denied);
    });
    await t.test("좋아요는 본인 문서와 카운터를 함께 변경해야 함", async () => {
      const like = doc(post, "likes", other.uid);
      const ownerLike = doc(post, "likes", owner.uid);
      await assert.rejects(
        setDoc(like, { createdAt: serverTimestamp() }),
        denied,
      );
      await assert.rejects(
        updateDoc(post, { likeCount: increment(1) }),
        denied,
      );
      const forged = writeBatch(db);
      forged.set(ownerLike, { createdAt: serverTimestamp() });
      forged.update(post, { likeCount: increment(1) });
      await assert.rejects(forged.commit(), denied);
      const batch = writeBatch(db);
      batch.set(like, { createdAt: serverTimestamp() });
      batch.update(post, { likeCount: increment(1) });
      await batch.commit();
      assert.equal((await getDoc(post)).data().likeCount, 1);
      assert.equal((await getDoc(like)).exists(), true);
      const duplicate = writeBatch(db);
      duplicate.set(like, { createdAt: serverTimestamp() });
      duplicate.update(post, { likeCount: increment(1) });
      await assert.rejects(duplicate.commit(), denied);
      await assert.rejects(deleteDoc(like), denied);
      await assert.rejects(getDoc(ownerLike), denied);
      await assert.rejects(getDocs(collection(post, "likes")), denied);
      const undo = writeBatch(db);
      undo.delete(like);
      undo.update(post, { likeCount: increment(-1) });
      await undo.commit();
      assert.equal((await getDoc(post)).data().likeCount, 0);
      const ownComment = doc(collection(db, "communityComments"));
      await setDoc(ownComment, {
        postId: post.id,
        authorId: other.uid,
        content: "삭제할 댓글",
        ...stamp(),
      });
      await deleteDoc(ownComment);
    });
    await t.test("비로그인 공개 조회 허용, 모든 쓰기 거부", async () => {
      await signOut(auth);
      assert.equal((await getDoc(post)).data().title, "수정 제목");
      assert.equal((await getDoc(comment)).data().content, "수정 댓글");
      assert.ok((await getDocs(collection(db, "communityPosts"))).size > 0);
      assert.ok((await getDocs(collection(db, "communityComments"))).size > 0);
      await assert.rejects(
        setDoc(doc(collection(db, "communityPosts")), { ...data, ...stamp() }),
        denied,
      );
      await assert.rejects(
        setDoc(doc(collection(db, "communityComments")), {
          postId: post.id,
          authorId: other.uid,
          content: "댓글",
          ...stamp(),
        }),
        denied,
      );
      await assert.rejects(
        updateDoc(post, { title: "위조", updatedAt: serverTimestamp() }),
        denied,
      );
      await assert.rejects(deleteDoc(comment), denied);
      await assert.rejects(
        setDoc(doc(post, "likes", other.uid), { createdAt: serverTimestamp() }),
        denied,
      );
    });
  } finally {
    await deleteApp(app);
  }
});
