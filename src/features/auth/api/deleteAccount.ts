import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, getDocFromServer } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

import type { WithdrawalFeedback } from "@/features/auth/types/withdrawal";

import { firebaseAuth, firebaseDb, firebaseFunctions } from "@/lib/firebase";

type WithdrawalResult = { status: "processing" | "completed" };

export async function deleteAccount({
  feedback,
  password,
}: {
  feedback: WithdrawalFeedback;
  password: string;
}): Promise<WithdrawalResult> {
  const user = firebaseAuth.currentUser;
  if (!user?.email) throw new Error("로그인 후 다시 시도해주세요.");
  if (!navigator.onLine) throw new Error("인터넷 연결 후 다시 시도해주세요.");
  const reference = doc(firebaseDb, "withdrawalRequests", user.uid);
  const previous = await getDocFromServer(reference);
  if (previous.exists())
    return {
      status:
        previous.data().status === "completed" ? "completed" : "processing",
    };
  await reauthenticateWithCredential(
    user,
    EmailAuthProvider.credential(user.email, password),
  );
  await user.getIdToken(true);
  try {
    const withdraw = httpsCallable<WithdrawalFeedback, WithdrawalResult>(
      firebaseFunctions,
      "withdrawAccount",
      { timeout: 420_000 },
    );
    const { data } = await withdraw({
      ...feedback,
      detail: feedback.detail.trim(),
    });
    if (data.status !== "completed" && data.status !== "processing")
      throw new Error("탈퇴 처리 상태를 확인할 수 없습니다.");
    return data;
  } catch (error) {
    // 응답이 끊겨도 이미 접수된 요청을 실패로 안내하거나 새 요청으로 만들지 않습니다.
    const accepted = await getDocFromServer(reference).catch(() => null);
    if (accepted?.exists())
      return {
        status:
          accepted.data().status === "completed" ? "completed" : "processing",
      };
    throw error;
  }
}
