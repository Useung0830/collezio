import Link from "next/link";

import LinkButton from "@/components/common/button/LinkButton";
import ProfileAvatar from "@/features/user/components/ProfileAvatar";
import { useProfileUserId } from "@/features/user/hooks/useProfileUserId";
import { usePublicProfileQuery } from "@/features/user/hooks/usePublicProfileQuery";

import BellIcon from "@/assets/icons/icon-bell-outline.svg";

type HeaderAuthActionsProps = {
  isLoggedIn: boolean;
};

export default function HeaderAuthActions({
  isLoggedIn,
}: HeaderAuthActionsProps) {
  const userId = useProfileUserId();
  const { data: profile } = usePublicProfileQuery(isLoggedIn ? userId : null);
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
        <ProfileAvatar
          imageUrl={profile?.imageUrl ?? null}
          nickname={profile?.nickname ?? "내"}
          size="compact"
        />
      </Link>
    </div>
  );
}
