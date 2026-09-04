"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import ImageUploader from "@/components/common/ImageUploader";

import CloseIcon from "@/assets/icons/icon-close.svg";
import RightIcon from "@/assets/icons/icon-right.svg";

import SelectionButton from "./SelectionButton";

type TransactionType = "exchange" | "sale";
type DeliveryType = "direct" | "parcel";

export default function NewProductForm() {
  const router = useRouter();

  const [transactionType, setTransactionType] =
    useState<TransactionType>("exchange");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("direct");
  const [shippingFee, setShippingFee] = useState("");
  const [isFreeShipping, setIsFreeShipping] = useState(false);

  const handleClose = () => {
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
        <ImageUploader maxImageCount={10} showRepresentativeLabel />

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
