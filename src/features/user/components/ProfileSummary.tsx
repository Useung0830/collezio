"use client";

import { useState } from "react";

import Button from "@/components/common/button/Button";
import ProfileEditModal from "@/features/user/components/ProfileEditModal";
import PublicProfileCard from "@/features/user/components/PublicProfileCard";
import { useProfileUserId } from "@/features/user/hooks/useProfileUserId";
import { usePublicProfileQuery } from "@/features/user/hooks/usePublicProfileQuery";

export default function ProfileSummary() {
  const userId = useProfileUserId();
  const { data: profile } = usePublicProfileQuery(userId);
  const [isEditing, setIsEditing] = useState(false);
  return (
    <section
      aria-label="내 프로필"
      className="border-black-200 text-black-900 flex items-center gap-4 rounded-2xl border px-7 py-5"
    >
      {userId === undefined ? (
        <p role="status" className="text-body-16">
          로그인 상태를 확인하고 있습니다.
        </p>
      ) : userId ? (
        <PublicProfileCard userId={userId} showBio />
      ) : (
        <p className="text-body-16">로그인 후 프로필을 확인해주세요.</p>
      )}
      {userId && profile && (
        <Button
          size="xs"
          className="ml-auto"
          aria-label="프로필 수정"
          onClick={() => setIsEditing(true)}
        >
          수정
        </Button>
      )}
      {isEditing && userId && profile && (
        <ProfileEditModal
          key={userId}
          profile={profile}
          onClose={() => setIsEditing(false)}
        />
      )}
    </section>
  );
}
