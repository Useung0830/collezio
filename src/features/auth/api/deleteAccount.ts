import {
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from "firebase/auth";
import { doc, getDocFromServer } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

import type { WithdrawalFeedback } from "@/features/auth/types/withdrawal";
import { isGoogleOnlyUser } from "@/features/auth/utils/isGoogleOnlyUser";

import { firebaseAuth, firebaseDb, firebaseFunctions } from "@/lib/firebase";

type WithdrawalResult = { status: "processing" | "completed" };

export async function deleteAccount({
  feedback,
  password,
}: {
  feedback: WithdrawalFeedback;
  password?: string;
}): Promise<WithdrawalResult> {
  const user = firebaseAuth.currentUser;
  if (!user?.email) throw new Error("로그인 후 다시 시도해주세요.");
  if (!navigator.onLine) throw new Error("인터넷 연결 후 다시 시도해주세요.");
  const isGoogleAccount = isGoogleOnlyUser(user);
  // 사용자 클릭 직후 팝업을 열어 비동기 조회로 인한 브라우저 팝업 차단을 피합니다.
  if (isGoogleAccount) {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await reauthenticateWithPopup(user, provider);
  }
  const reference = doc(firebaseDb, "withdrawalRequests", user.uid);
  const previous = await getDocFromServer(reference);
  if (previous.exists())
    return {
      status:
        previous.data().status === "completed" ? "completed" : "processing",
    };
  if (!isGoogleAccount) {
    if (!password) throw new Error("비밀번호를 입력해주세요.");
    await reauthenticateWithCredential(
      user,
      EmailAuthProvider.credential(user.email, password),
    );
  }
  if (firebaseAuth.currentUser?.uid !== user.uid) {
    throw new Error("로그인 상태가 변경되었습니다. 다시 로그인해주세요.");
  }
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
