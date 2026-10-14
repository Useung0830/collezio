"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { signOut } from "firebase/auth";

import Button from "@/components/common/button/Button";
import AuthInputField from "@/features/auth/components/AuthInputField";
import { getSignupError } from "@/features/auth/utils/getSignupError";
import { saveProfile } from "@/features/user/api/saveProfile";

import { firebaseAuth } from "@/lib/firebase";

import ProfileIcon from "@/assets/icons/icon-profile.svg";

type GoogleSignupFormValues = {
  nickname: string;
  hasAcceptedTerms: boolean;
  hasAcceptedPrivacy: boolean;
};
type GoogleSignupFormProps = { userId: string };

export default function GoogleSignupForm({ userId }: GoogleSignupFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<GoogleSignupFormValues>({
    defaultValues: {
      nickname: "",
      hasAcceptedTerms: false,
      hasAcceptedPrivacy: false,
    },
  });
  const handleSignup = async (values: GoogleSignupFormValues) => {
    try {
      if (firebaseAuth.currentUser?.uid !== userId)
        throw new Error("로그인 상태가 변경되었습니다.");
      const result = await saveProfile({ mode: "complete-signup", ...values });
      // 구버전 서버가 가입 완료 표시를 저장하지 않았다면 완료로 표시하지 않습니다.
      if (
        !result.profile ||
        typeof result.profile !== "object" ||
        !("googleSignupCompleted" in result.profile) ||
        result.profile.googleSignupCompleted !== true
      ) {
        throw new Error("가입 정보를 저장하지 못했습니다.");
      }
      await queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.setQueryData(["googleSignup", userId], true);
      router.replace("/");
    } catch (error) {
      const { field, message } = getSignupError(error);
      setError(field === "nickname" ? "nickname" : "root.server", { message });
    }
  };
  return (
    <main className="flex justify-center px-3 py-20">
      <div className="flex w-full max-w-100 flex-col gap-6">
        <h1 className="text-heading-24 text-black-900">
          가입을 마무리해주세요
        </h1>
        <p className="text-body-16 text-black-900">
          콜레지오에서 사용할 닉네임을 정하고 필수 약관에 동의해주세요.
        </p>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(handleSignup)}
        >
          <AuthInputField
            placeholder="닉네임"
            autoComplete="nickname"
            icon={<ProfileIcon className="size-6" />}
            error={errors.nickname?.message}
            registration={register("nickname", {
              setValueAs: (value: string) => value.trim(),
              required: "닉네임을 입력해주세요.",
              minLength: {
                value: 2,
                message: "닉네임은 2~10자로 입력해주세요.",
              },
              maxLength: {
                value: 10,
                message: "닉네임은 2~10자로 입력해주세요.",
              },
            })}
          />
          <label className="text-body-14 flex items-center gap-2">
            <input
              type="checkbox"
              {...register("hasAcceptedTerms", {
                required: "이용약관에 동의해주세요.",
              })}
            />
            이용약관에 동의합니다. (필수)
          </label>
          <label className="text-body-14 flex items-center gap-2">
            <input
              type="checkbox"
              {...register("hasAcceptedPrivacy", {
                required: "개인정보처리방침에 동의해주세요.",
              })}
            />
            개인정보처리방침에 동의합니다. (필수)
          </label>
          {(errors.hasAcceptedTerms ||
            errors.hasAcceptedPrivacy ||
            errors.root?.server) && (
            <p role="alert" className="text-body-14 text-red-500">
              {errors.hasAcceptedTerms?.message ??
                errors.hasAcceptedPrivacy?.message ??
                errors.root?.server?.message}
            </p>
          )}
          <Button
            type="submit"
            shape="square"
            variant="green"
            isLoading={isSubmitting}
          >
            가입 완료
          </Button>
          <Button
            disabled={isSubmitting}
            onClick={() => void signOut(firebaseAuth)}
          >
            로그아웃
          </Button>
        </form>
      </div>
    </main>
  );
}
