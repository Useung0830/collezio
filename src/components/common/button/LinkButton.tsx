import type { ComponentProps } from "react";
import Link from "next/link";

import type { ButtonStyleProps } from "./buttonStyles";
import { getButtonClasses } from "./buttonStyles";

type LinkButtonProps = ComponentProps<typeof Link> & ButtonStyleProps;

export default function LinkButton({
  variant,
  size,
  shape,
  className,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      {...props}
      className={getButtonClasses({ variant, size, shape, className })}
    />
  );
}
