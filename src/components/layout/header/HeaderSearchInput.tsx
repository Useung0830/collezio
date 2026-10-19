"use client";

import type { RefObject } from "react";
import { useRef, useState } from "react";

import ArrowRightIcon from "@/assets/icons/icon-arrow-right.svg";
import CloseIcon from "@/assets/icons/icon-close.svg";

type HeaderSearchInputProps = {
  defaultValue: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  isCompact?: boolean;
  tabIndex?: number;
};

export default function HeaderSearchInput({
  defaultValue,
  inputRef,
  isCompact = false,
  tabIndex,
}: HeaderSearchInputProps) {
  const ownInputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const hasSearchText = value.trim().length > 0;

  const handleClear = () => {
    setValue("");
    ownInputRef.current?.focus();
  };

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <input
        ref={(element) => {
          ownInputRef.current = element;
          if (inputRef) inputRef.current = element;
        }}
        type="text"
        role="searchbox"
        name="query"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        maxLength={100}
        inputMode="search"
        enterKeyHint="search"
        aria-label="검색어"
        placeholder="검색어를 입력해주세요"
        className={`${isCompact ? "text-body-14" : "text-body-16"} min-w-0 flex-1 outline-none`}
        tabIndex={tabIndex}
      />
      {value && (
        <button
          type="button"
          aria-label="검색어 지우기"
          onClick={handleClear}
          tabIndex={tabIndex}
          className="text-black-500 hover:bg-black-50 focus-visible:outline-brand-blue flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2"
        >
          <CloseIcon className="size-5" aria-hidden="true" />
        </button>
      )}
      <button
        type="submit"
        aria-label="검색"
        className={`flex size-6 shrink-0 items-center justify-center rounded-full transition-colors ${hasSearchText ? "bg-brand-blue text-white" : "bg-black-200 text-black-500"}`}
        tabIndex={tabIndex}
      >
        <ArrowRightIcon className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
