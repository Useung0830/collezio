"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";

import { firebaseAuth } from "@/lib/firebase";

import LogoGnb from "@/assets/images/logo-gnb.svg";

import HeaderActionsSkeleton from "./HeaderActionsSkeleton";
import HeaderAuthActions from "./HeaderAuthActions";
import HeaderMobileActions from "./HeaderMobileActions";
import HeaderSearchBar from "./HeaderSearchBar";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (user) => {
      setIsLoggedIn(user !== null);
    });
  }, []);

  return (
    <header className="flex w-full items-center justify-center px-4 py-3 max-lg:px-3">
      <div className="flex w-full max-w-280 items-center justify-between gap-5">
        <Link
          href="/"
          className={`shrink-0 ${isMobileSearchOpen ? "max-lg:hidden" : ""}`}
        >
          <LogoGnb
            className="h-8.75 w-32 max-lg:h-7.75 max-lg:w-28"
            aria-label="콜레지오 로고"
          />
        </Link>
        <Suspense
          fallback={
            <div className="border-black-200 h-11 max-w-150 min-w-0 flex-1 rounded-full border max-lg:hidden" />
          }
        >
          <HeaderSearchBar className="max-w-150 min-w-0 flex-1 max-lg:hidden" />
        </Suspense>
        <ul className="flex shrink-0 gap-5 max-lg:hidden">
          <li>
            <Link href="/chat" className="whitespace-nowrap">
              채팅
            </Link>
          </li>
          <li>
            <Link href="/community" className="whitespace-nowrap">
              커뮤니티
            </Link>
          </li>
        </ul>
        <div className="flex h-10 w-46 shrink-0 items-center justify-end max-lg:hidden">
          {isLoggedIn === null ? (
            <HeaderActionsSkeleton />
          ) : (
            <HeaderAuthActions isLoggedIn={isLoggedIn} />
          )}
        </div>
        <div className="ml-auto min-w-0 flex-1 lg:hidden">
          {isLoggedIn === null ? (
            <HeaderActionsSkeleton isMobile />
          ) : (
            <HeaderMobileActions
              isLoggedIn={isLoggedIn}
              onSearchOpenChange={setIsMobileSearchOpen}
            />
          )}
        </div>
      </div>
    </header>
  );
}
