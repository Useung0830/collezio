import Link from "next/link";

import LinkButton from "@/components/common/button/LinkButton";

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
        <LinkButton
          href="/login"
          size="compact"
          shape="square"
          variant="outline"
          className="whitespace-nowrap"
        >
          로그인
        </LinkButton>
        <LinkButton
          href="/signup"
          size="compact"
          shape="square"
          variant="blue"
          className="whitespace-nowrap"
        >
          회원가입
        </LinkButton>
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
