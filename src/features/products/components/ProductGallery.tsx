"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  title: string;
  imageUrls: string[];
}

export default function ProductGallery({
  title,
  imageUrls,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = imageUrls[selectedIndex] ?? imageUrls[0];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="bg-black-100 relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg md:rounded-2xl">
        {selectedImage ? (
          <Image
            src={selectedImage}
            alt={title}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <p className="text-body-16 text-black-600">등록된 사진이 없습니다.</p>
        )}
      </div>
      {imageUrls.length > 1 && (
        <div
          role="group"
          aria-label="상품 사진 선택"
          className="flex gap-2 overflow-x-auto pb-2"
        >
          {imageUrls.map((url, index) => (
            <button
              key={url}
              type="button"
              aria-label={`상품 사진 ${index + 1}`}
              aria-pressed={selectedIndex === index}
              onClick={() => setSelectedIndex(index)}
              className={`relative size-20 shrink-0 overflow-hidden rounded-lg border-2 ${selectedIndex === index ? "border-brand-blue" : "border-transparent"}`}
            >
              <Image
                src={url}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
