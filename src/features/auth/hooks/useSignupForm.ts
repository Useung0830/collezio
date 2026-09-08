import { useForm, useWatch } from "react-hook-form";

import { createAccount } from "@/features/auth/api/createAccount";
import type { SignupFormValues } from "@/features/auth/types/signup";
import { getSignupError } from "@/features/auth/utils/getSignupError";

export function useSignupForm() {
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      nickname: "",
      hasAcceptedTerms: false,
      hasAcceptedPrivacy: false,
    },
  });

  const {
    email = "",
    password = "",
    confirmPassword = "",
    nickname = "",
    hasAcceptedTerms = false,
    hasAcceptedPrivacy = false,
  } = useWatch({ control });

  const isFormReady =
    email.trim() !== "" &&
    password !== "" &&
    confirmPassword !== "" &&
    nickname.trim() !== "" &&
    hasAcceptedTerms &&
    hasAcceptedPrivacy;

  const handleSignup = async (values: SignupFormValues) => {
    try {
      await createAccount(values);
      alert("회원가입이 완료되었습니다. 이메일 인증을 진행해주세요.");
    } catch (error) {
      const { field, message } = getSignupError(error);
      setError(field, { message }, { shouldFocus: field !== "root.server" });
    }
  };

  return {
    register,
    getValues,
    errors,
    isSubmitting,
    isFormReady,
    handleSubmit: handleSubmit(handleSignup),
  };
}
