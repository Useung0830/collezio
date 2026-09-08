import type {
  Control,
  UseFormGetValues,
  UseFormRegister,
} from "react-hook-form";
import { useFormState } from "react-hook-form";

import type { SignupFormValues } from "@/features/auth/types/signup";

import VisibilityIcon from "@/assets/icons/icon-eye-thin.svg";
import PasswordIcon from "@/assets/icons/icon-lock.svg";

import AuthInputField from "./AuthInputField";

type SignupPasswordFieldsProps = {
  control: Control<SignupFormValues>;
  register: UseFormRegister<SignupFormValues>;
  getValues: UseFormGetValues<SignupFormValues>;
};

export default function SignupPasswordFields({
  control,
  register,
  getValues,
}: SignupPasswordFieldsProps) {
  const { errors } = useFormState({
    control,
    name: ["password", "confirmPassword"],
    exact: true,
  });

  return (
    <>
      <AuthInputField
        type="password"
        placeholder="비밀번호"
        autoComplete="new-password"
        icon={<PasswordIcon className="size-6" />}
        trailingIcon={<VisibilityIcon className="size-6" />}
        error={errors.password?.message}
        registration={register("password", {
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
      <AuthInputField
        type="password"
        placeholder="비밀번호 확인"
        autoComplete="new-password"
        icon={<PasswordIcon className="size-6" />}
        trailingIcon={<VisibilityIcon className="size-6" />}
        error={errors.confirmPassword?.message}
        registration={register("confirmPassword", {
          required: "비밀번호를 다시 입력해 주세요.",
          validate: (value) =>
            value === getValues("password") || "비밀번호가 일치하지 않습니다.",
        })}
      />
    </>
  );
}
