import { randomUUID } from "node:crypto";

import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { error as logError } from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";

import { parseWithdrawalFeedback } from "./parseWithdrawalFeedback.js";
import { processWithdrawal } from "./processWithdrawal.js";

initializeApp();
const db = getFirestore();
const services = () => ({ db, auth: getAuth(), bucket: getStorage().bucket() });

export const withdrawAccount = onCall(
  { region: "asia-northeast3", timeoutSeconds: 540 },
  async (request) => {
    if (!request.auth)
      throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    const userId = request.auth.uid;
    const reference = db.doc(`withdrawalRequests/${userId}`);
    const previous = await reference.get();
    if (previous.exists) return { status: previous.get("status") };
    const authTime = request.auth.token.auth_time;
    if (typeof authTime !== "number" || Date.now() / 1000 - authTime > 300)
      throw new HttpsError(
        "failed-precondition",
        "비밀번호를 다시 확인해주세요.",
      );
    let feedback;
    try {
      feedback = parseWithdrawalFeedback(request.data);
    } catch {
      throw new HttpsError(
        "invalid-argument",
        "탈퇴 사유 입력을 확인해주세요.",
      );
    }
    // Auth를 먼저 삭제하면 실패한 데이터 정리를 재개할 근거가 없어지므로 접수를 먼저 기록합니다.
    await db.runTransaction(async (transaction) => {
      if ((await transaction.get(reference)).exists) return;
      transaction.create(reference, {
        status: "processing",
        feedback,
        feedbackId: randomUUID(),
        createdAt: FieldValue.serverTimestamp(),
        stage: 0,
        cursor: "",
      });
    });
    try {
      return { status: await processWithdrawal(services(), userId) };
    } catch (error) {
      logError("Withdrawal cleanup will retry", {
        code: error.code ?? "unknown",
      });
      return { status: "processing" };
    }
  },
);

// 브라우저가 닫히거나 호출이 중단돼도 저장된 단계부터 재개합니다.
export const retryWithdrawals = onSchedule(
  {
    region: "asia-northeast3",
    schedule: "every 10 minutes",
    timeoutSeconds: 540,
  },
  async () => {
    const requests = await db
      .collection("withdrawalRequests")
      .where("status", "==", "processing")
      .orderBy("createdAt")
      .limit(10)
      .get();
    await Promise.all(
      requests.docs.map(async (document) => {
        try {
          await processWithdrawal(services(), document.id);
        } catch (error) {
          logError("Withdrawal retry failed", {
            code: error.code ?? "unknown",
          });
        }
      }),
    );
  },
);
