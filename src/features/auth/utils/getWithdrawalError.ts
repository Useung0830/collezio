import { FirebaseError } from "firebase/app";

export function getWithdrawalError(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/popup-closed-by-user":
      case "auth/cancelled-popup-request":
        return "Google 인증이 취소되었습니다. 탈퇴하려면 다시 인증해주세요.";
      case "auth/popup-blocked":
        return "팝업이 차단되었습니다. 팝업을 허용한 뒤 다시 시도해주세요.";
      case "auth/user-mismatch":
        return "현재 로그인한 Google 계정을 선택해주세요.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/invalid-login-credentials":
        return "비밀번호가 올바르지 않습니다. 다시 확인해주세요.";
      case "auth/too-many-requests":
        return "요청이 많습니다. 잠시 후 다시 시도해주세요.";
      case "auth/network-request-failed":
        return "인터넷 연결을 확인한 뒤 다시 시도해주세요.";
      case "auth/requires-recent-login":
      case "functions/failed-precondition":
        return "본인 확인이 만료되었습니다. 다시 인증해주세요.";
      default:
        return "탈퇴 처리 상태를 확인하지 못했습니다. 연결 상태를 확인하고 다시 시도해주세요.";
    }
  }
  return error instanceof Error ? error.message : "";
}
