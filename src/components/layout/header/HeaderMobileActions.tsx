"use client";

import { useEffect, useRef, useState } from "react";

import MenuIcon from "@/assets/icons/icon-menu.svg";
import SearchIcon from "@/assets/icons/icon-search.svg";

import HeaderSearchBar from "./HeaderSearchBar";
import MobileMenuDrawer from "./MobileMenuDrawer";

type HeaderMobileActionsProps = {
  isLoggedIn: boolean;
};

export default function HeaderMobileActions({
  isLoggedIn,
}: HeaderMobileActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleOpenSearch = () => {
    setIsSearchOpen(true);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
  };

  const handleOpenMenu = () => {
    setIsMenuOpen(true);
  };

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
  };

  useEffect(() => {
    if (!isMenuOpen && !isSearchOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isMenuOpen) {
          handleCloseMenu();
          return;
        }

        handleCloseSearch();
      }
    };

    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen, isSearchOpen]);

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !searchContainerRef.current?.contains(event.target)
      ) {
        handleCloseSearch();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isSearchOpen]);

  return (
    <div className="flex w-full min-w-0 items-center justify-end gap-5 lg:hidden">
      <div
        ref={searchContainerRef}
        className={`origin-right overflow-hidden transition-all duration-300 ease-out ${
          isSearchOpen
            ? "max-w-full flex-1 opacity-100"
            : "pointer-events-none max-w-0 opacity-0"
        }`}
      >
        <HeaderSearchBar
          inputRef={searchInputRef}
          isCompact
          tabIndex={isSearchOpen ? 0 : -1}
        />
      </div>

      {!isSearchOpen && (
        <button aria-label="검색 열기" onClick={handleOpenSearch}>
          <SearchIcon className="text-black-900 size-6" aria-hidden="true" />
        </button>
      )}
      <button aria-label="메뉴 열기" onClick={handleOpenMenu}>
        <MenuIcon className="text-black-900 size-6" aria-hidden="true" />
      </button>

      <MobileMenuDrawer
        isLoggedIn={isLoggedIn}
        isOpen={isMenuOpen}
        onClose={handleCloseMenu}
      />
    </div>
  );
}
