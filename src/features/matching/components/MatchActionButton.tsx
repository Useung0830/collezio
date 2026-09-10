import type { ButtonProps } from "@/components/common/button/Button";
import Button from "@/components/common/button/Button";

type MatchActionButtonProps = Omit<ButtonProps, "size">;

export default function MatchActionButton({
  children,
  className = "",
  ...props
}: MatchActionButtonProps) {
  return (
    <Button
      {...props}
      size="compact"
      className={`min-w-0 overflow-hidden text-center ${className}`}
    >
      <span className="truncate">{children}</span>
    </Button>
  );
}
