"use client";

import Button from "@/components/common/button/Button";
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
      <Button
        type="submit"
        variant="green"
        shape="square"
        disabled={!isFormReady}
        isLoading={isSubmitting}
        className="disabled:bg-black-400 w-full"
      >
        {isSubmitting ? "가입 중..." : "회원가입"}
      </Button>
    </form>
  );
}
