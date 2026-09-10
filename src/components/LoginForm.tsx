"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";

import AuthInputField from "@/features/auth/components/AuthInputField";

import { firebaseAuth } from "@/lib/firebase";

import EmailIcon from "@/assets/icons/icon-email.svg";
import VisibilityIcon from "@/assets/icons/icon-eye-thin.svg";
import PasswordIcon from "@/assets/icons/icon-lock.svg";

import Button from "./common/button/Button";

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ reValidateMode: "onSubmit" });

  const handleLogin = async ({ email, password }: LoginFormValues) => {
    try {
      await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      router.replace("/");
    } catch {
      setError("root", {
        message: "로그인에 실패했습니다. 입력값과 연결 상태를 확인해주세요.",
      });
    }
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(handleLogin)}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-3">
        <AuthInputField
          type="email"
          placeholder="이메일"
          autoComplete="username"
          icon={<EmailIcon className="size-6" />}
          error={errors.email?.message}
          registration={register("email", {
            setValueAs: (value: string) => value.trim(),
            required: "이메일을 입력해주세요.",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "올바른 이메일 형식이 아닙니다.",
            },
          })}
        />
        <AuthInputField
          type="password"
          placeholder="비밀번호"
          autoComplete="current-password"
          icon={<PasswordIcon className="size-6" />}
          trailingIcon={<VisibilityIcon className="size-6" />}
          error={errors.password?.message ?? errors.root?.message}
          registration={register("password", {
            required: "비밀번호를 입력해주세요.",
          })}
        />
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        variant="green"
        shape="square"
        className="w-full"
      >
        로그인
      </Button>
    </form>
  );
}
