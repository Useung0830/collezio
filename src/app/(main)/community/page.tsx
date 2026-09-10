import LinkButton from "@/components/common/button/LinkButton";
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

      <LinkButton
        variant="green"
        href="/community/new"
        className="fixed right-4 bottom-8 z-40 shadow-lg sm:right-8 lg:right-[max(2rem,calc((100vw-46rem)/2))]"
      >
        글쓰기
      </LinkButton>
    </section>
  );
}
