type MatchActionButtonProps = {
  children: React.ReactNode;
  variant?: "default" | "primary";
};

export default function MatchActionButton({
  children,
  variant = "default",
}: MatchActionButtonProps) {
  const colorClassName =
    variant === "primary"
      ? "border-black-900 bg-black-900 text-white"
      : "border-black-900 bg-white text-black-900";

  return (
    <button
      className={`text-label-14 inline-flex min-w-0 items-center justify-center overflow-hidden rounded-full border px-3 py-2 text-center sm:px-5 ${colorClassName}`}
    >
      <span className="truncate">{children}</span>
    </button>
  );
}
