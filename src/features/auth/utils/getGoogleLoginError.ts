import { FirebaseError } from "firebase/app";

export function getGoogleLoginError(error: unknown): string | null {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/popup-closed-by-user":
      case "auth/cancelled-popup-request":
        return null;
      case "auth/popup-blocked":
        return "팝업이 차단되었습니다. 브라우저에서 팝업을 허용한 뒤 다시 시도해주세요.";
      case "auth/unauthorized-domain":
      case "auth/operation-not-allowed":
        return "현재 Google 로그인을 사용할 수 없습니다. 관리자에게 문의해주세요.";
      case "auth/account-exists-with-different-credential":
        return "이미 다른 방법으로 가입한 이메일입니다. 기존 로그인 방법을 이용해주세요.";
      case "auth/network-request-failed":
        return "네트워크 연결을 확인한 뒤 다시 시도해주세요.";
      case "auth/too-many-requests":
        return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
      case "auth/user-disabled":
        return "사용이 중지된 계정입니다. 관리자에게 문의해주세요.";
    }
  }

  return "Google 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.";
}
