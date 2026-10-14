export type ButtonStyleProps = {
  variant?: "primary" | "outline" | "ghost" | "blue" | "green" | "muted";
  size?: "xs" | "compact" | "sm" | "md" | "lg" | "text";
  shape?: "pill" | "rounded" | "square";
  className?: string;
};

export const BUTTON_INTERACTION_CLASSES =
  "inline-flex shrink-0 items-center justify-center gap-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black-900 disabled:cursor-not-allowed disabled:opacity-50";

const variantClasses = {
  primary:
    "bg-black-900 text-white enabled:hover:bg-black-800 [&:any-link:hover]:bg-black-800",
  outline:
    "border border-black-300 bg-white text-black-900 enabled:hover:bg-black-50 [&:any-link:hover]:bg-black-50",
  ghost:
    "text-black-900 enabled:hover:bg-black-100 [&:any-link:hover]:bg-black-100",
  blue: "bg-brand-blue text-white enabled:hover:brightness-95 [&:any-link:hover]:brightness-95",
  green:
    "bg-brand-green text-white enabled:hover:brightness-95 [&:any-link:hover]:brightness-95",
  muted:
    "text-black-600 enabled:hover:text-black-900 [&:any-link:hover]:text-black-900",
};

const sizeClasses = {
  xs: "text-caption-12-bold px-3 py-1.5",
  compact: "text-label-14 px-4 py-2",
  sm: "text-label-14 px-4 py-2.5",
  md: "text-label-16 px-5 py-3",
  lg: "text-label-16 px-10 py-4",
  text: "text-label-14",
};

const shapeClasses = {
  pill: "rounded-full",
  rounded: "rounded-2xl",
  square: "rounded-lg",
};

export function getButtonClasses({
  variant = "outline",
  size = "md",
  shape = "pill",
  className,
}: ButtonStyleProps = {}) {
  return [
    BUTTON_INTERACTION_CLASSES,
    variantClasses[variant],
    sizeClasses[size],
    shapeClasses[shape],
    className,
  ]
    .filter(Boolean)
    .join(" ");
}
