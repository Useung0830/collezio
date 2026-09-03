import Link from "next/link";

import BellIcon from "@/assets/icons/icon-bell-outline.svg";
import ProfileIcon from "@/assets/icons/icon-profile.svg";

type HeaderAuthActionsProps = {
  isLoggedIn: boolean;
};

export default function HeaderAuthActions({
  isLoggedIn,
}: HeaderAuthActionsProps) {
  if (!isLoggedIn) {
    return (
      <nav aria-label="회원 메뉴" className="flex items-center gap-3">
        <Link
          href="/login"
          className="border-black-200 text-label-14 text-black-900 rounded-lg border px-4 py-2 whitespace-nowrap"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="bg-brand-blue text-label-14 rounded-lg px-4 py-2 whitespace-nowrap text-white"
        >
          회원가입
        </Link>
      </nav>
    );
  }

  return (
    <div className="flex items-center justify-center gap-5">
      <BellIcon className="text-black-900 size-5" aria-label="알림" />
      <Link
        href="/collections"
        aria-label="마이페이지"
        className="border-black-100 flex size-8 items-center justify-center rounded-full border"
      >
        <ProfileIcon className="size-6" aria-hidden="true" />
      </Link>
    </div>
  );
}
