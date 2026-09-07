"use client";

import { useForm } from "react-hook-form";
import Link from "next/link";
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  updateProfile,
} from "firebase/auth";

import { firebaseAuth } from "@/lib/firebase";

import EmailIcon from "@/assets/icons/icon-email.svg";
import VisibilityIcon from "@/assets/icons/icon-eye-thin.svg";
import PasswordIcon from "@/assets/icons/icon-lock.svg";
import ProfileIcon from "@/assets/icons/icon-profile.svg";
import LogoGnb from "@/assets/images/logo-gnb.svg";

interface SignupFormValues {
  email: string;
  password: string;
  confirmPassword: string;
  nickname: string;
  hasAcceptedTerms: boolean;
  hasAcceptedPrivacy: boolean;
}

export default function SignupPage() {
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    watch,
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
    email,
    password,
    confirmPassword,
    nickname,
    hasAcceptedTerms,
    hasAcceptedPrivacy,
  } = watch();

  const isFormReady =
    email.trim() !== "" &&
    password !== "" &&
    confirmPassword !== "" &&
    nickname.trim() !== "" &&
    hasAcceptedTerms &&
    hasAcceptedPrivacy;

  const onSubmit = async ({ email, password, nickname }: SignupFormValues) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        firebaseAuth,
        email.trim(),
        password,
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: nickname.trim() });
      await sendEmailVerification(user);
      await signOut(firebaseAuth);
      alert("회원가입이 완료되었습니다. 이메일 인증을 진행해주세요.");
    } catch (error) {
      if (!(error instanceof FirebaseError)) {
        setError("root.server", {
          message: "알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        });
        return;
      }
      switch (error.code) {
        case "auth/email-already-in-use":
          setError(
            "email",
            {
              message: "이미 사용 중인 이메일입니다.",
            },
            {
              shouldFocus: true,
            },
          );
          break;

        case "auth/invalid-email":
          setError(
            "email",
            {
              message: "올바른 이메일 형식이 아닙니다.",
            },
            {
              shouldFocus: true,
            },
          );
          break;

        case "auth/weak-password":
        case "auth/password-does-not-meet-requirements":
          setError(
            "password",
            {
              message: "비밀번호가 보안 조건을 충족하지 않습니다.",
            },
            {
              shouldFocus: true,
            },
          );
          break;

        case "auth/network-request-failed":
          setError("root.server", {
            message: "네트워크 연결을 확인해 주세요.",
          });
          break;

        case "auth/too-many-requests":
          setError("root.server", {
            message: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
          });
          break;

        default:
          setError("root.server", {
            message: "회원가입 중 오류가 발생했습니다.",
          });
      }
    }
  };

  return (
    <main className="flex flex-col items-center justify-center py-20">
      <Link href="/">
        <LogoGnb
          className="mb-10 h-11 w-auto lg:h-13"
          aria-label="콜레지오 로고"
        />
      </Link>
      <div className="flex w-full max-w-137 flex-col justify-center gap-4 rounded-2xl p-3 pt-0 lg:px-17.75">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-heading-24 text-black-900">회원가입</h1>
            <p className="text-body-16 text-black-900">
              내 컬렉션의 새로운 가치를 만나보세요.
            </p>
          </div>
          <form
            className="flex flex-col gap-6"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="flex flex-col gap-3">
              <div className="border-black-200 flex items-center gap-2 rounded-lg border p-4">
                <EmailIcon className="size-6" />
                <input
                  id="email"
                  type="email"
                  placeholder="이메일"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  className="text-body-16 text-black-900 w-full outline-none"
                  {...register("email", {
                    required: "이메일을 입력해주세요.",
                  })}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
              <div className="border-black-200 flex items-center gap-2 rounded-lg border p-4">
                <PasswordIcon className="size-6" />
                <input
                  id="password"
                  type="password"
                  placeholder="비밀번호"
                  autoComplete="new-password"
                  className="text-body-16 w-full outline-none"
                  {...register("password", {
                    required: "비밀번호를 입력해 주세요.",
                    minLength: {
                      value: 8,
                      message: "비밀번호는 8자 이상이어야 합니다.",
                    },
                    maxLength: {
                      value: 20,
                      message: "비밀번호는 20자 이하여야 합니다.",
                    },
                  })}
                />
                <VisibilityIcon className="size-6" />
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
              <div className="border-black-200 flex items-center gap-2 rounded-lg border p-4">
                <PasswordIcon className="size-6" />
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="비밀번호 확인"
                  autoComplete="new-password"
                  className="text-body-16 w-full outline-none"
                  {...register("confirmPassword", {
                    required: "비밀번호를 다시 입력해 주세요.",
                    validate: (value) =>
                      value === getValues("password") ||
                      "비밀번호가 일치하지 않습니다.",
                  })}
                />
                <VisibilityIcon className="size-6" />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
              <div className="border-black-200 flex items-center gap-2 rounded-lg border p-4">
                <ProfileIcon className="size-6" />
                <input
                  type="text"
                  placeholder="닉네임"
                  className="text-body-16 text-black-900 w-full outline-none"
                  {...register("nickname", {
                    required: "닉네임을 입력해주세요.",
                    minLength: {
                      value: 2,
                      message: "닉네임은 2자 이상이어야 합니다.",
                    },
                    maxLength: {
                      value: 10,
                      message: "닉네임은 10자 이하여야 합니다.",
                    },
                  })}
                />
              </div>
              {errors.nickname && (
                <p className="text-sm text-red-500">
                  {errors.nickname.message}
                </p>
              )}
            </div>
            <div className="text-body-14 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    {...register("hasAcceptedTerms", {
                      required: "이용약관에 동의해 주세요.",
                    })}
                  />
                  <p>이용약관에 동의합니다.</p>
                </div>
                <span className="bg-black-100 border-black-200 rounded-sm border px-2 py-1">
                  보기
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    {...register("hasAcceptedPrivacy", {
                      required: "개인정보처리방침에 동의해 주세요.",
                    })}
                  />
                  <p>개인정보처리방침에 동의합니다.</p>
                </div>
                <span className="bg-black-100 border-black-200 rounded-sm border px-2 py-1">
                  보기
                </span>
              </div>
            </div>
            {errors.root?.server && (
              <p role="alert" className="text-sm text-red-500">
                {errors.root.server.message}
              </p>
            )}
            <button
              type="submit"
              disabled={!isFormReady || isSubmitting}
              className="bg-brand-green disabled:bg-black-400 w-full rounded-lg py-3 text-white"
            >
              {isSubmitting ? "가입 중..." : "회원가입"}
            </button>
          </form>
        </div>
        <div className="text-body-14 flex items-center justify-center gap-3">
          <div className="flex items-center justify-center gap-2">
            <p className="text-black-700">이미 계정이 있으신가요?</p>
            <Link href="/login">
              <span className="text-brand-green">로그인</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
