import type { ComponentProps } from "react";

import { BUTTON_INTERACTION_CLASSES } from "./buttonStyles";

type IconButtonProps = Omit<ComponentProps<"button">, "type" | "aria-label"> & {
  "aria-label": string;
  size?: "sm" | "md";
};

const sizeClasses = {
  sm: "size-8",
  md: "size-10",
};

export default function IconButton({
  children,
  size = "md",
  className = "",
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      type="button"
      className={`${BUTTON_INTERACTION_CLASSES} text-black-900 enabled:hover:bg-black-100 rounded-full ${sizeClasses[size]} ${className}`}
    >
      <span
        aria-hidden="true"
        className="inline-flex items-center justify-center"
      >
        {children}
      </span>
    </button>
  );
}
