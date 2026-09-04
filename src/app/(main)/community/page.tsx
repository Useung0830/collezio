import Link from "next/link";

import CommunityListBackButton from "@/features/community/components/CommunityListBackButton";
import CommunityPostList from "@/features/community/components/CommunityPostList";

export default function CommunityPage() {
  return (
    <section className="relative mx-auto w-full max-w-184 pb-24">
      <div className="flex items-center gap-2">
        <CommunityListBackButton />
        <h1 className="text-heading-24 text-black-900">게시글목록</h1>
      </div>

      <div className="mt-8">
        <CommunityPostList />
      </div>

      <Link
        href="/community/new"
        className="bg-brand-green text-label-14 fixed right-4 bottom-8 z-40 flex items-center justify-center rounded-full px-5 py-3 text-white shadow-lg sm:right-8 lg:right-[max(2rem,calc((100vw-46rem)/2))]"
      >
        글쓰기
      </Link>
    </section>
  );
}
