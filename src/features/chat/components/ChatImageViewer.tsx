"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface ChatImageViewerProps {
  images: { url: string; file: File }[];
  onClose: () => void;
}

export default function ChatImageViewer({
  images,
  onClose,
}: ChatImageViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [index, setIndex] = useState(0);
  const [notice, setNotice] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const image = images[index];
  const handleMove = (direction: number) => {
    setIndex((current) =>
      Math.max(0, Math.min(images.length - 1, current + direction)),
    );
    setNotice("");
  };
  const handleShare = async () => {
    const files = [image.file];
    if (!navigator.canShare?.({ files })) {
      setNotice(
        "이 브라우저에서는 사진 공유를 지원하지 않습니다. 사진을 저장한 뒤 공유해주세요.",
      );
      return;
    }
    setIsSharing(true);
    try {
      await navigator.share({ files });
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError"))
        setNotice("사진을 공유하지 못했습니다. 다시 시도해주세요.");
    } finally {
      setIsSharing(false);
    }
  };
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.showModal();
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return (
    <dialog
      ref={dialogRef}
      aria-label="사진 상세 보기"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          handleMove(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
      className="text-body-14 fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-black/95 text-white backdrop:bg-black/80"
    >
      <div className="flex h-full flex-col pt-[env(safe-area-inset-top)] pb-[max(24px,env(safe-area-inset-bottom))]">
        <header className="flex shrink-0 items-center justify-between gap-3 p-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="사진 상세 닫기"
            className="flex size-11 items-center justify-center"
          >
            ✕
          </button>
          <p aria-live="polite">
            {index + 1} / {images.length}
          </p>
          <div className="flex items-center gap-4">
            <a
              href={image.url}
              download={image.file.name}
              className="py-3"
              aria-label="현재 사진 저장"
            >
              저장
            </a>
            <button
              type="button"
              onClick={() => void handleShare()}
              disabled={isSharing}
              className="py-3 disabled:opacity-50"
            >
              공유
            </button>
          </div>
        </header>
        <div
          className="relative min-h-0 flex-1 touch-pan-y"
          onTouchStart={(event) => {
            const touch = event.touches[0];
            touchStart.current = { x: touch.clientX, y: touch.clientY };
          }}
          onTouchEnd={(event) => {
            const start = touchStart.current;
            touchStart.current = null;
            if (!start) return;
            const touch = event.changedTouches[0];
            const distance = touch.clientX - start.x;
            if (
              Math.abs(distance) > 50 &&
              Math.abs(distance) > Math.abs(touch.clientY - start.y)
            )
              handleMove(distance < 0 ? 1 : -1);
          }}
        >
          <Image
            src={image.url}
            alt={`사진 ${index + 1}`}
            fill
            unoptimized
            className="object-contain"
          />
          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="이전 사진"
                disabled={index === 0}
                onClick={() => handleMove(-1)}
                className="absolute top-1/2 left-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 disabled:opacity-30"
              >
                ←
              </button>
              <button
                type="button"
                aria-label="다음 사진"
                disabled={index === images.length - 1}
                onClick={() => handleMove(1)}
                className="absolute top-1/2 right-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 disabled:opacity-30"
              >
                →
              </button>
            </>
          )}
        </div>
        {notice && (
          <p role="status" className="shrink-0 px-4 pt-3 text-center">
            {notice}
          </p>
        )}
      </div>
    </dialog>
  );
}
