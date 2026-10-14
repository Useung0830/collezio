"use client";

import { useState } from "react";
import Script from "next/script";

import Button from "@/components/common/button/Button";

import RightIcon from "@/assets/icons/icon-right.svg";

import PostcodeSearchModal from "./PostcodeSearchModal";

type TradeLocationFieldProps = {
  value: { address: string; detail: string };
  onChange: (value: TradeLocationFieldProps["value"]) => void;
};

const MAX_LOCATION_LENGTH = 200;

export default function TradeLocationField({
  value,
  onChange,
}: TradeLocationFieldProps) {
  const [isReady, setIsReady] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const location = [value.address, value.detail.trim()]
    .filter(Boolean)
    .join(" ");

  const handleSearch = () => {
    setErrorMessage("");
    setIsSearchOpen(true);
  };

  const handleAddressSelect = (address: string) => {
    setIsSearchOpen(false);
    if (!address || address.length > MAX_LOCATION_LENGTH) {
      setErrorMessage(
        "다른 주소를 선택해주세요. 주소는 200자 이하여야 합니다.",
      );
      return;
    }
    onChange({
      address,
      detail: address === value.address ? value.detail : "",
    });
  };

  return (
    <div className="mt-3 flex min-w-0 flex-col gap-3">
      <Script
        src="https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
        onReady={() => setIsReady(Boolean(window.kakao?.Postcode))}
        onError={() => {
          setIsReady(false);
          setErrorMessage(
            "주소 검색을 불러오지 못했습니다. 페이지를 새로고침해주세요.",
          );
        }}
      />
      <Button
        shape="rounded"
        className="min-h-13"
        disabled={!isReady}
        aria-label={
          value.address ? "거래 희망 장소 변경" : "거래 희망 장소 선택"
        }
        onClick={handleSearch}
      >
        <span className="text-body-16 min-w-0 flex-1 text-left wrap-break-word">
          {value.address || "거래 희망 장소"}
        </span>
        <span className="text-body-14 text-black-400 flex shrink-0 items-center gap-2">
          {isReady
            ? value.address
              ? "변경"
              : "위치 추가"
            : "주소 검색 준비 중"}
          <RightIcon className="text-black-900 size-5" aria-hidden="true" />
        </span>
      </Button>
      {value.address && (
        <label className="text-label-14 text-black-900 flex flex-col gap-2">
          만날 장소 설명 (선택)
          <input
            type="text"
            value={value.detail}
            maxLength={Math.max(
              0,
              MAX_LOCATION_LENGTH - value.address.length - 1,
            )}
            placeholder="예: 정문 앞, 2번 출구 앞"
            className="border-black-300 text-body-16 text-black-900 placeholder:text-black-400 focus:border-black-900 h-13 rounded-2xl border px-5 outline-none"
            onChange={(event) =>
              onChange({ ...value, detail: event.target.value })
            }
          />
        </label>
      )}
      <input type="hidden" name="location" value={location} />
      {isSearchOpen && (
        <PostcodeSearchModal
          onSelect={handleAddressSelect}
          onClose={() => setIsSearchOpen(false)}
          onError={() => {
            setIsSearchOpen(false);
            setErrorMessage(
              "주소 검색창을 열지 못했습니다. 다시 시도해주세요.",
            );
          }}
        />
      )}
      {errorMessage && (
        <p role="alert" className="text-body-14 text-black-900">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
