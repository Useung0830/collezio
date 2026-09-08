"use client";

import { useSignupForm } from "@/features/auth/hooks/useSignupForm";

import SignupAgreements from "./SignupAgreements";
import SignupFields from "./SignupFields";

export default function SignupForm() {
  const {
    control,
    register,
    getValues,
    errors,
    isSubmitting,
    isFormReady,
    handleSubmit,
  } = useSignupForm();

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <SignupFields
        control={control}
        register={register}
        getValues={getValues}
      />
      <SignupAgreements register={register} />
      {errors.root?.server && (
        <p role="alert" className="text-body-14 text-red-500">
          {errors.root.server.message}
        </p>
      )}
      <button
        type="submit"
        disabled={!isFormReady || isSubmitting}
        className="text-body-16 bg-brand-green disabled:bg-black-400 w-full rounded-lg py-3 text-white"
      >
        {isSubmitting ? "가입 중..." : "회원가입"}
      </button>
    </form>
  );
}
