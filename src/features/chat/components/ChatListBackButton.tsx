"use client";

import { useRouter } from "next/navigation";

import RightIcon from "@/assets/icons/icon-right.svg";

export default function ChatListBackButton() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <button type="button" aria-label="이전 페이지로 이동" onClick={handleBack}>
      <RightIcon
        className="text-black-900 size-5 rotate-180"
        aria-hidden="true"
      />
    </button>
  );
}
