import Link from "next/link";

import ArrowRightIcon from "@/assets/icons/icon_arrow-right.svg";
import BellIcon from "@/assets/icons/icon_bell_outline.svg";
import DownSolidIcon from "@/assets/icons/icon_down-solid.svg";
import ProfileIcon from "@/assets/icons/icon_profile.svg";
import LogoGnb from "@/assets/images/logo_gnb.svg";

export default function Header() {
  return (
    <header className="flex w-full items-center justify-center px-4 py-3 max-lg:px-3">
      <div className="flex w-full max-w-280 items-center justify-between">
        <Link href="/" className="shrink-0">
          <LogoGnb className="h-8.75 w-32" aria-label="콜레지오 로고" />
        </Link>
        <div className="border-black-200 flex w-full max-w-150 rounded-full border px-3 py-2">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-body-16 whitespace-nowrap">전체</span>
              <DownSolidIcon
                className="text-black-900 size-4"
                aria-hidden="true"
              />
              <div className="border-black-200 h-6 border-l" />
            </div>
            <input
              type="text"
              placeholder="검색어를 입력해주세요"
              className="flex-1"
            />
            <button className="bg-black-200 flex items-center justify-between rounded-full p-1.5">
              <ArrowRightIcon
                className="text-black-500 size-4"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
        <ul className="flex gap-5">
          <Link href="/chat" className="whitespace-nowrap">
            채팅
          </Link>
          <Link href="/community" className="whitespace-nowrap">
            커뮤니티
          </Link>
        </ul>
        <div className="flex items-center justify-center gap-5">
          <BellIcon className="text-black-400 size-5" aria-label="알림" />
          <Link href="/my">
            <div className="border-black-100 flex h-8 w-8 items-center justify-center rounded-full border">
              <ProfileIcon className="size-6" aria-label="프로필" />
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
