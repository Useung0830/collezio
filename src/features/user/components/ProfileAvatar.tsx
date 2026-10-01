"use client";

import { useState } from "react";
import Image from "next/image";

import ProfileIcon from "@/assets/icons/icon-profile.svg";

interface ProfileAvatarProps {
  imageUrl: string | null;
  nickname: string;
  size?: "sm" | "md";
}

export default function ProfileAvatar({
  imageUrl,
  nickname,
  size = "md",
}: ProfileAvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return (
    <div
      className={`bg-black-100 relative flex shrink-0 items-center justify-center overflow-hidden rounded-full ${size === "sm" ? "size-6" : "size-16"}`}
    >
      {imageUrl && failedUrl !== imageUrl ? (
        <Image
          src={imageUrl}
          alt={`${nickname} 프로필`}
          fill
          sizes={size === "sm" ? "24px" : "64px"}
          className="object-cover"
          onError={() => setFailedUrl(imageUrl)}
        />
      ) : (
        <ProfileIcon
          className={`text-black-400 ${size === "sm" ? "size-4" : "size-8"}`}
          aria-label={`${nickname} 기본 프로필`}
        />
      )}
    </div>
  );
}
