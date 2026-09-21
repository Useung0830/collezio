"use client";
import { useState } from "react";
import { toast } from "react-toastify/unstyled";
import { useRouter } from "next/navigation";

import Button from "@/components/common/button/Button";
import IconButton from "@/components/common/button/IconButton";
import ToggleButton from "@/components/common/button/ToggleButton";
import ImageUploader from "@/components/common/ImageUploader";
import RadioOption from "@/components/common/radio-group/RadioOption";
import { useRegisterProductMutation } from "@/features/products/hooks/useRegisterProductMutation";
import type {
  ProductDelivery,
  ProductTransaction,
} from "@/features/products/types/product";

import CloseIcon from "@/assets/icons/icon-close.svg";

import TradeLocationField from "./TradeLocationField";

type TransactionType = "exchange" | "sale";
type DeliveryType = "direct" | "parcel";

export default function NewProductForm() {
  const router = useRouter();

  const registerProductMutation = useRegisterProductMutation();

  const [transactionType, setTransactionType] =
    useState<TransactionType>("exchange");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("direct");
  const [shippingFee, setShippingFee] = useState("");
  const [isFreeShipping, setIsFreeShipping] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [tradeLocation, setTradeLocation] = useState({
    address: "",
    detail: "",
  });

  const handleClose = () => {
    router.back();
  };

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      registerProductMutation.isPending ||
      registerProductMutation.isSuccess
    ) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!title || !description) {
      toast.error("제목과 자세한 설명을 입력해주세요.");
      return;
    }

    let transaction: ProductTransaction;

    if (transactionType === "exchange") {
      const desiredItemName = String(formData.get("desiredItem") ?? "").trim();

      if (!desiredItemName) {
        toast.error("교환을 희망하는 상품명을 입력해주세요.");
        return;
      }

      transaction = { type: "exchange", desiredItemName };
    } else {
      const priceText = String(formData.get("price") ?? "").trim();
      const price = Number(priceText);

      if (!priceText || !Number.isSafeInteger(price) || price < 0) {
        toast.error("판매 가격은 0 이상의 정수로 입력해주세요.");
        return;
      }

      transaction = { type: "sale", price };
    }

    let delivery: ProductDelivery;

    if (deliveryType === "direct") {
      const location = [tradeLocation.address, tradeLocation.detail.trim()]
        .filter(Boolean)
        .join(" ");

      if (!tradeLocation.address || location.length > 200) {
        toast.error("거래 장소를 선택하고 200자 이내로 입력해주세요.");
        return;
      }

      delivery = { type: "direct", location };
    } else {
      const fee = isFreeShipping ? 0 : Number(shippingFee);

      if (
        (!isFreeShipping && !shippingFee.trim()) ||
        !Number.isSafeInteger(fee) ||
        fee < 0
      ) {
        toast.error("택배비는 0 이상의 정수로 입력해주세요.");
        return;
      }

      delivery = { type: "parcel", shippingFee: fee };
    }

    registerProductMutation.mutate(
      { title, description, transaction, delivery, files },
      {
        onSuccess: () => {
          toast.success("상품이 등록되었습니다.");
        },
        onError: () => {
          toast.error(
            "상품 등록에 실패했습니다. 입력값과 연결 상태를 확인해주세요.",
          );
        },
      },
    );
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
        <ImageUploader
          maxImageCount={10}
          showRepresentativeLabel
          onFilesChange={setFiles}
        />

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
            <TradeLocationField
              value={tradeLocation}
              onChange={setTradeLocation}
            />
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

        <Button
          type="submit"
          shape="rounded"
          className="h-13"
          disabled={
            registerProductMutation.isPending ||
            registerProductMutation.isSuccess ||
            files.length === 0 ||
            (isDirect && !tradeLocation.address)
          }
        >
          {registerProductMutation.isPending
            ? "등록 중..."
            : registerProductMutation.isSuccess
              ? "등록 완료"
              : isExchange
                ? "교환하기"
                : "판매하기"}
        </Button>
      </form>
    </section>
  );
}
