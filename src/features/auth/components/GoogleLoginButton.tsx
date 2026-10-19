"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/common/button/Button";
import { signInWithGoogle } from "@/features/auth/api/signInWithGoogle";
import { getGoogleLoginError } from "@/features/auth/utils/getGoogleLoginError";

import GoogleLogoIcon from "@/assets/icons/icon-google-logo.svg";

export default function GoogleLoginButton() {
  const router = useRouter();
  const isLoginPending = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    if (isLoginPending.current) return;

    isLoginPending.current = true;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await signInWithGoogle();
      router.replace("/");
    } catch (error) {
      setErrorMessage(getGoogleLoginError(error));
    } finally {
      isLoginPending.current = false;
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        shape="square"
        className="relative"
        isLoading={isLoading}
        onClick={handleGoogleLogin}
        aria-describedby={errorMessage ? "google-login-error" : undefined}
      >
        <GoogleLogoIcon className="absolute left-5 size-4" aria-hidden="true" />
        <span className="text-body-16 text-black-900">
          {isLoading ? "Google 로그인 중" : "Google로 계속"}
        </span>
      </Button>
      {errorMessage && (
        <p
          id="google-login-error"
          role="alert"
          className="text-body-14 text-red-500"
        >
          {errorMessage}
        </p>
      )}
    </>
  );
}
