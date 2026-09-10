"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";

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
  } = useForm<LoginFormValues>();

  const handleLogin = async ({ email, password }: LoginFormValues) => {
    try {
      await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      router.replace("/");
    } catch {
      setError("root", {
        message: "로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleLogin)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="border-black-200 flex items-center gap-2 rounded-lg border p-4">
          <EmailIcon className="size-6" />
          <input
            type="email"
            placeholder="이메일"
            className="text-body-16 text-black-900 w-full outline-none"
            {...register("email", { required: "이메일을 입력해주세요." })}
          />
        </div>
        <div className="border-black-200 flex items-center gap-2 rounded-lg border p-4">
          <PasswordIcon className="size-6" />
          <input
            type="password"
            placeholder="비밀번호"
            className="text-body-16 w-full outline-none"
            {...register("password", { required: "비밀번호를 입력해주세요." })}
          />
          <VisibilityIcon className="size-6" />
        </div>
      </div>
      {errors.root && <p role="alert">{errors.root.message}</p>}
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
