"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import CloseIcon from "@/assets/icons/icon-close.svg";
import GalleryIcon from "@/assets/icons/icon-gallery.svg";

type ImageUploaderProps = {
  maxImageCount?: number;
  showRepresentativeLabel?: boolean;
  triggerVariant?: "text" | "tile";
};

type UploadedImage = {
  id: string;
  name: string;
  url: string;
};

export default function ImageUploader({
  maxImageCount = 10,
  showRepresentativeLabel = false,
  triggerVariant = "tile",
}: ImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const imageUrls = useRef(new Set<string>());

  useEffect(() => {
    const uploadedImageUrls = imageUrls.current;

    return () => {
      uploadedImageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    const availableCount = maxImageCount - images.length;
    const newImages = selectedFiles.slice(0, availableCount).map((file) => {
      const url = URL.createObjectURL(file);
      imageUrls.current.add(url);

      return {
        id: `${file.name}-${file.lastModified}-${url}`,
        name: file.name,
        url,
      };
    });

    setImages((currentImages) => [...currentImages, ...newImages]);
    event.target.value = "";
  };

  const handleImageRemove = (imageId: string) => {
    setImages((currentImages) => {
      const removedImage = currentImages.find((image) => image.id === imageId);

      if (removedImage) {
        URL.revokeObjectURL(removedImage.url);
        imageUrls.current.delete(removedImage.url);
      }

      return currentImages.filter((image) => image.id !== imageId);
    });
  };

  const isTextTrigger = triggerVariant === "text";

  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">사진 등록</legend>
      <div className="flex gap-3 overflow-x-auto pt-1 pr-1">
        <label
          className={
            isTextTrigger
              ? "text-body-14 text-black-600 flex shrink-0 cursor-pointer items-center gap-1"
              : "border-black-300 text-black-400 flex size-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border"
          }
        >
          <GalleryIcon
            className={isTextTrigger ? "size-5" : "size-7"}
            aria-hidden="true"
          />
          <span className={isTextTrigger ? "" : "text-body-14"}>
            {isTextTrigger ? "사진" : `${images.length}/${maxImageCount}`}
          </span>
          {isTextTrigger && images.length > 0 && (
            <span className="text-caption-12 text-black-400">
              {images.length}/{maxImageCount}
            </span>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={images.length >= maxImageCount}
            onChange={handleImageUpload}
          />
        </label>

        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative size-24 shrink-0 overflow-visible"
          >
            <div className="bg-black-100 relative size-full overflow-hidden rounded-2xl">
              <Image
                src={image.url}
                alt={image.name}
                fill
                unoptimized
                sizes="96px"
                className="object-cover"
              />
              {showRepresentativeLabel && index === 0 && (
                <span className="text-caption-12-bold absolute right-0 bottom-0 left-0 bg-black/70 py-1 text-center text-white">
                  대표 사진
                </span>
              )}
            </div>
            <button
              type="button"
              className="border-black-200 text-black-900 absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full border bg-white"
              aria-label={`${image.name} 삭제`}
              onClick={() => handleImageRemove(image.id)}
            >
              <CloseIcon className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
