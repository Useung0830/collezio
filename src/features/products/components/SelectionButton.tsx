type SelectionButtonProps = {
  children: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
};

export default function SelectionButton({
  children,
  isSelected,
  onClick,
}: SelectionButtonProps) {
  return (
    <button
      type="button"
      className={`text-label-14 rounded-full border px-4 py-2 ${
        isSelected
          ? "border-black-900 bg-black-900 text-white"
          : "border-black-200 text-black-400 bg-white"
      }`}
      aria-pressed={isSelected}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
