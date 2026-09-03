"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import CloseIcon from "@/assets/icons/icon-close.svg";
import GalleryIcon from "@/assets/icons/icon-gallery.svg";
import RightIcon from "@/assets/icons/icon-right.svg";

import SelectionButton from "./SelectionButton";

const MAX_IMAGE_COUNT = 10;

type TransactionType = "exchange" | "sale";
type DeliveryType = "direct" | "parcel";

type ProductImage = {
  id: string;
  name: string;
  url: string;
};

export default function NewProductForm() {
  const router = useRouter();

  const [images, setImages] = useState<ProductImage[]>([]);
  const [transactionType, setTransactionType] =
    useState<TransactionType>("exchange");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("direct");
  const [shippingFee, setShippingFee] = useState("");
  const [isFreeShipping, setIsFreeShipping] = useState(false);

  const imageUrls = useRef(new Set<string>());

  useEffect(() => {
    const uploadedImageUrls = imageUrls.current;

    return () => {
      uploadedImageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    const availableCount = MAX_IMAGE_COUNT - images.length;

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

  const handleClose = () => {
    imageUrls.current.forEach((url) => URL.revokeObjectURL(url));
    router.back();
  };

  const isExchange = transactionType === "exchange";
  const isDirect = deliveryType === "direct";

  return (
    <section className="mx-auto w-full max-w-184 pb-20">
      <div className="mb-7 flex items-center gap-2">
        <button type="button" aria-label="상품 등록 닫기" onClick={handleClose}>
          <CloseIcon className="size-6" aria-hidden="true" />
        </button>
        <h1 className="text-heading-24 text-black-900">상품 등록</h1>
      </div>

      <form className="flex flex-col gap-7">
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">상품 사진</legend>
          <div className="flex gap-3 overflow-x-auto pt-1 pr-1">
            <label className="border-black-300 text-black-400 flex size-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border">
              <GalleryIcon className="size-7" aria-hidden="true" />
              <span className="text-body-14">
                {images.length}/{MAX_IMAGE_COUNT}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                disabled={images.length >= MAX_IMAGE_COUNT}
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
                  {index === 0 && (
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

        <label className="text-label-16 text-black-900 flex flex-col gap-3">
          제목
          <input
            name="title"
            type="text"
            required
            placeholder="제목을 입력해주세요."
            className="border-black-300 text-body-16 text-black-900 placeholder:text-black-400 focus:border-black-900 h-13 rounded-2xl border px-5 outline-none"
          />
        </label>

        <label className="text-label-16 text-black-900 flex flex-col gap-3">
          자세한 설명
          <textarea
            name="description"
            required
            placeholder="게시글 내용을 작성해 주세요."
            className="border-black-300 text-body-16 text-black-900 placeholder:text-black-400 focus:border-black-900 h-29 resize-none rounded-2xl border px-5 py-4 outline-none"
          />
        </label>

        <fieldset className="flex flex-col">
          <legend className="text-label-16 text-black-900 mb-3">
            거래 방법
          </legend>
          <div className="flex gap-2">
            <SelectionButton
              isSelected={isExchange}
              onClick={() => setTransactionType("exchange")}
            >
              교환하기
            </SelectionButton>
            <SelectionButton
              isSelected={!isExchange}
              onClick={() => setTransactionType("sale")}
            >
              판매하기
            </SelectionButton>
          </div>
          <input
            name={isExchange ? "desiredItem" : "price"}
            type={isExchange ? "text" : "number"}
            min={isExchange ? undefined : 0}
            required
            placeholder={
              isExchange
                ? "교환을 희망하는 상품명을 입력해주세요."
                : "판매 가격을 입력해주세요."
            }
            className="border-black-300 text-body-16 text-black-900 placeholder:text-black-400 focus:border-black-900 mt-3 h-13 rounded-2xl border px-5 outline-none"
          />
        </fieldset>

        <fieldset className="flex flex-col">
          <legend className="text-label-16 text-black-900 mb-3">
            거래 방식
          </legend>
          <div className="flex gap-2">
            <SelectionButton
              isSelected={isDirect}
              onClick={() => setDeliveryType("direct")}
            >
              직거래
            </SelectionButton>
            <SelectionButton
              isSelected={!isDirect}
              onClick={() => setDeliveryType("parcel")}
            >
              택배 거래
            </SelectionButton>
          </div>
          {isDirect ? (
            <button
              type="button"
              className="border-black-300 text-body-16 text-black-900 mt-3 flex h-13 items-center justify-between rounded-2xl border px-5"
            >
              <span>거래 희망 장소</span>
              <span className="text-black-400 flex items-center gap-2">
                위치 추가
                <RightIcon
                  className="text-black-900 size-5"
                  aria-hidden="true"
                />
              </span>
            </button>
          ) : (
            <div className="mt-3 flex gap-2">
              <label className="border-black-300 focus-within:border-black-900 flex h-13 min-w-0 flex-1 items-center rounded-2xl border px-5">
                <span className="sr-only">택배비</span>
                <input
                  name="shippingFee"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  required={!isFreeShipping}
                  disabled={isFreeShipping}
                  value={shippingFee}
                  placeholder={
                    isFreeShipping ? "무료" : "택배비를 입력해주세요."
                  }
                  className="text-body-16 text-black-900 placeholder:text-black-400 min-w-0 flex-1 outline-none disabled:bg-transparent"
                  onChange={(event) => setShippingFee(event.target.value)}
                />
                {!isFreeShipping && (
                  <span className="text-body-16 text-black-600">원</span>
                )}
              </label>
              <button
                type="button"
                className={`text-label-14 shrink-0 rounded-2xl border px-4 ${
                  isFreeShipping
                    ? "border-black-900 bg-black-900 text-white"
                    : "border-black-200 text-black-600 bg-white"
                }`}
                aria-pressed={isFreeShipping}
                onClick={() => setIsFreeShipping((isFree) => !isFree)}
              >
                무료 배송
              </button>
            </div>
          )}
        </fieldset>

        <button
          type="button"
          className="border-black-300 text-label-16 text-black-900 h-13 rounded-2xl border"
        >
          {isExchange ? "교환하기" : "판매하기"}
        </button>
      </form>
    </section>
  );
}
