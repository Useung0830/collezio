"use client";

import { useState } from "react";
import Image from "next/image";

import ProfileIcon from "@/assets/icons/icon-profile.svg";

interface ProfileAvatarProps {
  imageUrl: string | null;
  nickname: string;
  size?: "sm" | "compact" | "md";
  isLoading?: boolean;
}

export default function ProfileAvatar({
  imageUrl,
  nickname,
  size = "md",
  isLoading = false,
}: ProfileAvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const isEmulator =
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === "demo-collezio";
  const displayUrl = isEmulator
    ? imageUrl?.replace(
        "https://firebasestorage.googleapis.com",
        "http://127.0.0.1:9199",
      )
    : imageUrl;
  const sizeClasses = { sm: "size-6", compact: "size-8", md: "size-16" };
  const imageSizes = { sm: "24px", compact: "32px", md: "64px" };
  const iconSizes = { sm: "size-4", compact: "size-6", md: "size-8" };
  const hasImage = Boolean(imageUrl && failedUrl !== imageUrl);
  const isImageLoading = hasImage && loadedUrl !== imageUrl;
  const shouldShowSkeleton = isLoading || isImageLoading;
  return (
    <div
      className={`bg-black-100 relative flex shrink-0 items-center justify-center overflow-hidden rounded-full ${sizeClasses[size]}`}
    >
      {shouldShowSkeleton && (
        <span
          role="status"
          className="bg-black-100 absolute inset-0 rounded-full motion-safe:animate-pulse"
        >
          <span className="sr-only">프로필을 불러오고 있습니다.</span>
        </span>
      )}
      {!isLoading && imageUrl && hasImage ? (
        <Image
          src={displayUrl ?? imageUrl}
          unoptimized={isEmulator || imageUrl.startsWith("blob:")}
          alt={`${nickname} 프로필`}
          fill
          sizes={imageSizes[size]}
          className={`object-cover ${isImageLoading ? "opacity-0" : ""}`}
          onLoad={() => setLoadedUrl(imageUrl)}
          onError={() => setFailedUrl(imageUrl)}
        />
      ) : !shouldShowSkeleton ? (
        <ProfileIcon
          className={`text-black-400 ${iconSizes[size]}`}
          aria-label={`${nickname} 기본 프로필`}
        />
      ) : null}
    </div>
  );
}
