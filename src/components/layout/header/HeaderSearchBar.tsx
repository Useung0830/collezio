import type { RefObject } from "react";

import ArrowRightIcon from "@/assets/icons/icon-arrow-right.svg";
import DownSolidIcon from "@/assets/icons/icon-down-solid.svg";

type HeaderSearchBarProps = {
  className?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  isCompact?: boolean;
  tabIndex?: number;
};

export default function HeaderSearchBar({
  className = "",
  inputRef,
  isCompact = false,
  tabIndex,
}: HeaderSearchBarProps) {
  const textClassName = isCompact ? "text-body-14" : "text-body-16";
  const paddingClassName = isCompact ? "px-2 py-1.5" : "px-3 py-2";

  return (
    <form
      role="search"
      action="/"
      className={`border-black-200 text-black-900 flex rounded-full border ${paddingClassName} ${className}`}
    >
      <div className="flex w-full min-w-0 items-center gap-2">
        <button
          type="button"
          className={`flex shrink-0 items-center gap-1 whitespace-nowrap ${textClassName}`}
          aria-label="검색 카테고리 선택"
          tabIndex={tabIndex}
        >
          <span>전체</span>
          <DownSolidIcon className="size-4" aria-hidden="true" />
        </button>
        <div className="border-black-200 h-6 shrink-0 border-l" />
        <input
          ref={inputRef}
          type="search"
          name="query"
          aria-label="검색어"
          placeholder="검색어를 입력해주세요"
          className={`${textClassName} min-w-0 flex-1 outline-none`}
          tabIndex={tabIndex}
        />
        <button
          type="submit"
          aria-label="검색"
          className="bg-black-200 flex size-6 shrink-0 items-center justify-center rounded-full"
          tabIndex={tabIndex}
        >
          <ArrowRightIcon
            className="text-black-500 size-4"
            aria-hidden="true"
          />
        </button>
      </div>
    </form>
  );
}
