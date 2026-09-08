import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

type AuthInputFieldProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "name" | "onChange" | "onBlur" | "className" | "children"
> & {
  registration: UseFormRegisterReturn;
  icon: ReactNode;
  trailingIcon?: ReactNode;
  error?: string;
};

export default function AuthInputField({
  registration,
  icon,
  trailingIcon,
  error,
  id = registration.name,
  ...inputProps
}: AuthInputFieldProps) {
  return (
    <>
      <div className="border-black-200 flex items-center gap-2 rounded-lg border p-4">
        {icon}
        <input
          {...inputProps}
          {...registration}
          id={id}
          aria-label={inputProps["aria-label"] ?? inputProps.placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="text-body-16 text-black-900 w-full outline-none"
        />
        {trailingIcon}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-body-14 text-red-500">
          {error}
        </p>
      )}
    </>
  );
}
