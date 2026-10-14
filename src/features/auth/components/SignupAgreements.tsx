import type { UseFormRegister } from "react-hook-form";

import type { SignupFormValues } from "@/features/auth/types/signup";

type SignupAgreementsProps = {
  register: UseFormRegister<SignupFormValues>;
};

export default function SignupAgreements({ register }: SignupAgreementsProps) {
  return (
    <div className="text-body-14 text-black-900 flex flex-col gap-1">
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
  );
}
