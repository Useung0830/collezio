import Image from "next/image";

import EditIcon from "@/assets/icons/icon-edit.svg";
import profileImage from "@/assets/images/profile.png";

export default function ProfileSummary() {
  return (
    <section className="border-black-200 text-black-900 flex items-center justify-between gap-4 rounded-2xl border px-7 py-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-full">
          <Image
            src={profileImage}
            alt="컬렉션 모아모아 프로필"
            className="object-cover"
            fill
            sizes="80px"
          />
        </div>
        <div className="flex max-w-120 min-w-0 flex-col gap-3">
          <h1 className="text-heading-20">컬렉션 모아모아</h1>
          <p className="text-body-14 text-black-600 max-md:hidden">
            안녕하세요. 여러 피규어를 모으고 있습니다. 특히 주토피아 너무
            좋아합니다.
          </p>
        </div>
      </div>
      <button className="border-black-200 text-label-14 inline-flex shrink-0 items-center justify-center gap-1 rounded-full border px-5 py-2">
        <EditIcon className="size-4" aria-hidden="true" />
        <span>프로필 수정</span>
      </button>
    </section>
  );
}
