"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/common/button/Button";
import IconButton from "@/components/common/button/IconButton";
import ToggleButton from "@/components/common/button/ToggleButton";
import ImageUploader from "@/components/common/ImageUploader";
import RadioOption from "@/components/common/radio-group/RadioOption";

import CloseIcon from "@/assets/icons/icon-close.svg";
import RightIcon from "@/assets/icons/icon-right.svg";

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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    // 상품 등록 API 연결 전에는 기본 GET 제출로 입력값이 URL에 노출되지 않게 합니다.
    event.preventDefault();
  };

  const isExchange = transactionType === "exchange";
  const isDirect = deliveryType === "direct";

  return (
    <section className="mx-auto w-full max-w-184 pb-20">
      <div className="mb-7 flex items-center gap-2">
        <IconButton size="sm" aria-label="상품 등록 닫기" onClick={handleClose}>
          <CloseIcon className="size-6" aria-hidden="true" />
        </IconButton>
        <h1 className="text-heading-24 text-black-900">상품 등록</h1>
      </div>

      <form className="flex flex-col gap-7" onSubmit={handleSubmit}>
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
            <RadioOption
              name="transactionType"
              value="exchange"
              checked={isExchange}
              onChange={() => setTransactionType("exchange")}
            >
              교환하기
            </RadioOption>
            <RadioOption
              name="transactionType"
              value="sale"
              checked={!isExchange}
              onChange={() => setTransactionType("sale")}
            >
              판매하기
            </RadioOption>
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
            <RadioOption
              name="deliveryType"
              value="direct"
              checked={isDirect}
              onChange={() => setDeliveryType("direct")}
            >
              직거래
            </RadioOption>
            <RadioOption
              name="deliveryType"
              value="parcel"
              checked={!isDirect}
              onChange={() => setDeliveryType("parcel")}
            >
              택배 거래
            </RadioOption>
          </div>
          {isDirect ? (
            <Button shape="rounded" className="mt-3 h-13">
              <span className="text-body-16 flex-1 text-left">
                거래 희망 장소
              </span>
              <span className="text-black-400 flex items-center gap-2">
                위치 추가
                <RightIcon
                  className="text-black-900 size-5"
                  aria-hidden="true"
                />
              </span>
            </Button>
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
              <ToggleButton
                size="compact"
                shape="rounded"
                isPressed={isFreeShipping}
                onClick={() => setIsFreeShipping((isFree) => !isFree)}
              >
                무료 배송
              </ToggleButton>
            </div>
          )}
        </fieldset>

        <Button type="submit" shape="rounded" className="h-13">
          {isExchange ? "교환하기" : "판매하기"}
        </Button>
      </form>
    </section>
  );
}
