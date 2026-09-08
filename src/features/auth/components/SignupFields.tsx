import type {
  FieldErrors,
  UseFormGetValues,
  UseFormRegister,
} from "react-hook-form";

import type { SignupFormValues } from "@/features/auth/types/signup";

import EmailIcon from "@/assets/icons/icon-email.svg";
import ProfileIcon from "@/assets/icons/icon-profile.svg";

import AuthInputField from "./AuthInputField";
import SignupPasswordFields from "./SignupPasswordFields";

type SignupFieldsProps = {
  register: UseFormRegister<SignupFormValues>;
  getValues: UseFormGetValues<SignupFormValues>;
  errors: FieldErrors<SignupFormValues>;
};

export default function SignupFields({
  register,
  getValues,
  errors,
}: SignupFieldsProps) {
  return (
    <div className="flex flex-col gap-3">
      <AuthInputField
        type="email"
        placeholder="이메일"
        autoComplete="email"
        icon={<EmailIcon className="size-6" />}
        error={errors.email?.message}
        registration={register("email", {
          required: "이메일을 입력해주세요.",
        })}
      />
      <SignupPasswordFields
        register={register}
        getValues={getValues}
        errors={{
          password: errors.password,
          confirmPassword: errors.confirmPassword,
        }}
      />
      <AuthInputField
        type="text"
        placeholder="닉네임"
        icon={<ProfileIcon className="size-6" />}
        error={errors.nickname?.message}
        registration={register("nickname", {
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
  );
}
