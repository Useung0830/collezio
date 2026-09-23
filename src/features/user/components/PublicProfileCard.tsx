"use client";

import Button from "@/components/common/button/Button";
import ProfileAvatar from "@/features/user/components/ProfileAvatar";
import { usePublicProfileQuery } from "@/features/user/hooks/usePublicProfileQuery";

import StarIcon from "@/assets/icons/icon-star.svg";

interface PublicProfileCardProps {
  userId: string;
  showBio?: boolean;
}

export default function PublicProfileCard({
  userId,
  showBio = false,
}: PublicProfileCardProps) {
  const query = usePublicProfileQuery(userId);
  if (query.isPending)
    return (
      <p role="status" className="text-body-16 text-black-900">
        프로필을 불러오고 있습니다.
      </p>
    );
  if (query.isError)
    return (
      <div className="text-black-900 flex flex-col items-start gap-2">
        <p role="alert" className="text-body-16">
          프로필을 불러오지 못했습니다.
        </p>
        <Button
          size="compact"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          다시 시도
        </Button>
      </div>
    );
  const profile = query.data;
  if (!profile)
    return (
      <p className="text-body-16 text-black-900">
        아직 등록된 프로필이 없습니다.
      </p>
    );
  return (
    <div className="text-black-900 flex min-w-0 items-center gap-4">
      <ProfileAvatar imageUrl={profile.imageUrl} nickname={profile.nickname} />
      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-body-18 wrap-anywhere">{profile.nickname}</p>
        <div className="text-body-14 flex flex-wrap items-center gap-1">
          <StarIcon className="text-brand-green size-4" aria-hidden="true" />
          <span>
            {profile.rating === null
              ? "평가 없음"
              : `평점 ${profile.rating.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}`}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {profile.tradeCount === null
              ? "거래 횟수 미집계"
              : `거래 ${profile.tradeCount.toLocaleString("ko-KR")}회`}
          </span>
        </div>
        {showBio && profile.bio && (
          <p className="text-body-14 wrap-anywhere whitespace-pre-wrap">
            {profile.bio}
          </p>
        )}
      </div>
    </div>
  );
}
