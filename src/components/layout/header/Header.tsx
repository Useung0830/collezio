"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";

import { firebaseAuth } from "@/lib/firebase";

import LogoGnb from "@/assets/images/logo-gnb.svg";

import HeaderAuthActions from "./HeaderAuthActions";
import HeaderMobileActions from "./HeaderMobileActions";
import HeaderSearchBar from "./HeaderSearchBar";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (user) => {
      setIsLoggedIn(user !== null);
    });
  }, []);

  return (
    <header className="flex w-full items-center justify-center px-4 py-3 max-lg:px-3">
      <div className="flex w-full max-w-280 items-center justify-between gap-5">
        <Link href="/" className="shrink-0">
          <LogoGnb
            className="h-8.75 w-32 max-lg:h-7.75 max-lg:w-28"
            aria-label="콜레지오 로고"
          />
        </Link>
        <HeaderSearchBar className="max-w-150 min-w-0 flex-1 max-lg:hidden" />
        <ul className="flex shrink-0 gap-5 max-lg:hidden">
          <Link href="/chat" className="whitespace-nowrap">
            채팅
          </Link>
          <Link href="/community" className="whitespace-nowrap">
            커뮤니티
          </Link>
        </ul>
        <div className="shrink-0 max-lg:hidden">
          {isLoggedIn !== null && <HeaderAuthActions isLoggedIn={isLoggedIn} />}
        </div>
        <div className="ml-auto min-w-0 flex-1 lg:hidden">
          {isLoggedIn !== null && (
            <HeaderMobileActions isLoggedIn={isLoggedIn} />
          )}
        </div>
      </div>
    </header>
  );
}
