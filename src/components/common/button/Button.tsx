import type { ComponentProps } from "react";

import type { ButtonStyleProps } from "./buttonStyles";
import { getButtonClasses } from "./buttonStyles";

export type ButtonProps = ComponentProps<"button"> &
  ButtonStyleProps & {
    isLoading?: boolean;
  };

export default function Button({
  children,
  type = "button",
  variant,
  size,
  shape,
  className,
  disabled,
  isLoading = false,
  "aria-busy": ariaBusy,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || ariaBusy}
      className={getButtonClasses({ variant, size, shape, className })}
    >
      {isLoading && (
        <span
          aria-hidden="true"
          className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
        />
      )}
      {children}
    </button>
  );
}
