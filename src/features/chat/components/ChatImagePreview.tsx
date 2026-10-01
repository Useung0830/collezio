import Image from "next/image";

interface ChatImagePreviewProps {
  url: string;
  disabled: boolean;
  onRemove: () => void;
}

export default function ChatImagePreview({
  url,
  disabled,
  onRemove,
}: ChatImagePreviewProps) {
  return (
    <div className="relative ml-11 w-fit pt-2 pr-2">
      <Image
        src={url}
        alt="첨부 이미지 미리보기"
        width={80}
        height={80}
        unoptimized
        className="border-black-200 size-20 rounded-xl border object-cover"
      />
      <button
        type="button"
        aria-label="첨부 이미지 삭제"
        disabled={disabled}
        onClick={onRemove}
        className="bg-black-900 absolute top-0 right-0 flex size-6 items-center justify-center rounded-full text-white disabled:opacity-50"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
