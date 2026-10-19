"use client";

import { useEffect, useId, useRef, useState } from "react";

import type { ProductCategory } from "@/features/products/constants/productCategories";
import { PRODUCT_CATEGORIES } from "@/features/products/constants/productCategories";

import CheckIcon from "@/assets/icons/icon-check.svg";
import DownIcon from "@/assets/icons/icon-down-solid.svg";

type ProductCategorySelectProps = {
  defaultValue?: ProductCategory | "";
  includeAll?: boolean;
  isCompact?: boolean;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  tabIndex?: number;
};

export default function ProductCategorySelect({
  defaultValue = "",
  includeAll = false,
  isCompact = false,
  label,
  name,
  placeholder = "카테고리를 선택해주세요.",
  required = false,
  tabIndex,
}: ProductCategorySelectProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<
    ProductCategory | ""
  >(defaultValue);
  const [isOpen, setIsOpen] = useState(false);

  const options: ReadonlyArray<{ value: ProductCategory | ""; label: string }> =
    includeAll
      ? [{ value: "", label: "전체" }, ...PRODUCT_CATEGORIES]
      : PRODUCT_CATEGORIES;
  const selectedIndex = options.findIndex(
    (option) => option.value === selectedCategory,
  );
  const selectedLabel = options[selectedIndex]?.label ?? placeholder;

  useEffect(() => {
    if (!isOpen) return;

    optionRefs.current[Math.max(selectedIndex, 0)]?.focus();
    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleFocusIn = (event: FocusEvent) => {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("focusin", handleFocusIn);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, [isOpen, selectedIndex]);

  const handleSelect = (value: ProductCategory | "") => {
    setSelectedCategory(value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  const handleListKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const focusedIndex = optionRefs.current.findIndex(
      (option) => option === document.activeElement,
    );
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      optionRefs.current[
        (focusedIndex + direction + options.length) % options.length
      ]?.focus();
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      optionRefs.current[
        event.key === "Home" ? 0 : options.length - 1
      ]?.focus();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative z-20 ${isCompact ? "shrink-0" : "w-full"}`}
    >
      <input type="hidden" name={name} value={selectedCategory} />
      <button
        ref={triggerRef}
        type="button"
        aria-label={required ? `${label}, 필수` : label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        tabIndex={tabIndex}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={handleTriggerKeyDown}
        className={`text-black-900 focus-visible:outline-brand-blue flex cursor-pointer items-center justify-between gap-2 transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 ${
          isCompact
            ? "text-body-14 hover:bg-black-50 h-8 min-w-19 rounded-full px-2"
            : "text-body-16 border-black-300 hover:border-black-900 focus-visible:border-black-900 h-13 w-full rounded-2xl border bg-white px-5"
        }`}
      >
        <span
          className={!selectedCategory && !includeAll ? "text-black-400" : ""}
        >
          {selectedLabel}
        </span>
        <DownIcon
          className={`size-3 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={label}
          onKeyDown={handleListKeyDown}
          className={`border-black-200 absolute top-full left-0 mt-2 rounded-2xl border bg-white p-1.5 shadow-lg ${isCompact ? "min-w-40" : "w-full"}`}
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              type="button"
              role="option"
              aria-selected={selectedCategory === option.value}
              tabIndex={-1}
              onClick={() => handleSelect(option.value)}
              className={`text-body-16 text-black-900 hover:bg-black-50 focus:bg-black-50 flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-left outline-none ${selectedCategory === option.value ? "bg-black-50" : ""}`}
            >
              {option.label}
              {selectedCategory === option.value && (
                <CheckIcon
                  className="text-brand-blue size-4"
                  aria-hidden="true"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
