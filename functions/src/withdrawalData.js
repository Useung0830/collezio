import { FieldPath, FieldValue } from "firebase-admin/firestore";

const PAGE_SIZE = 50;

export async function removeCountedDocument(db, reference, parent, countField) {
  await db.runTransaction(async (transaction) => {
    const [document, target] = await Promise.all([
      transaction.get(reference),
      transaction.get(parent),
    ]);
    if (!document.exists) return;
    if (target.exists) {
      const count = target.get(countField);
      if (Number.isSafeInteger(count) && count > 0)
        transaction.update(parent, { [countField]: count - 1 });
    }
    transaction.delete(reference);
  });
}

// 삭제 대상 자체를 마지막에 지워야 중간 실패 후에도 관계 데이터를 찾을 수 있습니다.
export async function removePost(db, reference) {
  for (;;) {
    const comments = await db
      .collection("communityComments")
      .where("postId", "==", reference.id)
      .limit(PAGE_SIZE)
      .get();
    if (comments.empty) break;
    const batch = db.batch();
    comments.docs.forEach((document) => batch.delete(document.ref));
    await batch.commit();
  }
  await db.recursiveDelete(reference);
}

export async function processDataPage(db, bucket, userId, stage, cursor) {
  const page = async (query, action, scan = false) => {
    let ordered = query.orderBy(FieldPath.documentId()).limit(PAGE_SIZE);
    if (scan && cursor) ordered = ordered.startAfter(cursor);
    const snapshot = await ordered.get();
    for (const document of snapshot.docs) await action(document);
    return snapshot.empty ? null : scan ? snapshot.docs.at(-1).id : "";
  };
  switch (stage) {
    case "favorites":
      return page(db.collection(`users/${userId}/favorites`), (document) =>
        removeCountedDocument(
          db,
          document.ref,
          db.doc(`products/${document.id}`),
          "favoriteCount",
        ),
      );
    case "likes":
      return page(
        db.collection("communityPosts"),
        (document) =>
          removeCountedDocument(
            db,
            document.ref.collection("likes").doc(userId),
            document.ref,
            "likeCount",
          ),
        true,
      );
    case "posts":
      return page(
        db.collection("communityPosts").where("authorId", "==", userId),
        (document) => removePost(db, document.ref),
      );
    case "postDeletions":
      return page(
        db.collection("communityPostDeletions").where("authorId", "==", userId),
        async (document) => {
          await removePost(db, db.doc(`communityPosts/${document.id}`));
          await document.ref.delete();
        },
      );
    case "comments":
      return page(
        db.collection("communityComments").where("authorId", "==", userId),
        (document) => document.ref.delete(),
      );
    case "products":
      return page(
        db.collection("products").where("sellerId", "==", userId),
        (document) => db.recursiveDelete(document.ref),
      );
    case "sellerChats":
    case "requesterChats":
      return page(
        db
          .collection("chatRooms")
          .where(
            stage === "sellerChats" ? "sellerId" : "requesterId",
            "==",
            userId,
          ),
        async (document) => {
          if (document.get("status") === "draft")
            await db.recursiveDelete(document.ref);
          else
            await document.ref.update({
              withdrawnUserIds: FieldValue.arrayUnion(userId),
            });
        },
        true,
      );
    case "productImages":
    case "communityImages": {
      const prefix = `${stage === "productImages" ? "products" : "community"}/${userId}/`;
      const [files] = await bucket.getFiles({
        prefix,
        maxResults: PAGE_SIZE,
        autoPaginate: false,
      });
      for (const file of files) await file.delete({ ignoreNotFound: true });
      return files.length ? "" : null;
    }
    case "profile":
      await db.doc(`profiles/${userId}`).delete();
      return null;
    case "user":
      await db.recursiveDelete(db.doc(`users/${userId}`));
      return null;
    default:
      throw new Error("Unknown withdrawal stage");
  }
}
