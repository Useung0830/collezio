import type { ButtonProps } from "./Button";
import Button from "./Button";

type ToggleButtonProps = Omit<
  ButtonProps,
  "type" | "variant" | "aria-pressed"
> & {
  isPressed: boolean;
};

export default function ToggleButton({
  isPressed,
  ...props
}: ToggleButtonProps) {
  return (
    <Button
      {...props}
      type="button"
      variant={isPressed ? "primary" : "outline"}
      aria-pressed={isPressed}
    />
  );
}
