import { FirebaseError } from "firebase/app";

type SignupError = {
  field: "email" | "password" | "root.server";
  message: string;
};

export function getSignupError(error: unknown): SignupError {
  if (!(error instanceof FirebaseError)) {
    return {
      field: "root.server",
      message: "알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    };
  }

  switch (error.code) {
    case "auth/email-already-in-use":
      return { field: "email", message: "이미 사용 중인 이메일입니다." };
    case "auth/invalid-email":
      return { field: "email", message: "올바른 이메일 형식이 아닙니다." };
    case "auth/weak-password":
    case "auth/password-does-not-meet-requirements":
      return {
        field: "password",
        message: "비밀번호가 보안 조건을 충족하지 않습니다.",
      };
    case "auth/network-request-failed":
      return {
        field: "root.server",
        message: "네트워크 연결을 확인해 주세요.",
      };
    case "auth/too-many-requests":
      return {
        field: "root.server",
        message: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
      };
    default:
      return {
        field: "root.server",
        message: "회원가입 중 오류가 발생했습니다.",
      };
  }
}
