export default function ProductDetailSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="m-auto flex w-full max-w-280 flex-col gap-6 md:flex-row md:gap-12"
    >
      <span className="sr-only">상품 정보를 불러오고 있습니다.</span>
      <div className="flex min-w-0 flex-1 flex-col gap-6" aria-hidden="true">
        <div className="bg-black-100 aspect-square w-full rounded-2xl motion-safe:animate-pulse" />
        <div className="bg-black-100 h-24 rounded-2xl motion-safe:animate-pulse" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-6" aria-hidden="true">
        <div className="bg-black-100 h-9 w-4/5 rounded motion-safe:animate-pulse" />
        <div className="bg-black-100 h-7 w-2/5 rounded motion-safe:animate-pulse" />
        <div className="bg-black-100 h-24 rounded motion-safe:animate-pulse" />
        <div className="bg-black-100 h-20 rounded motion-safe:animate-pulse" />
      </div>
    </div>
  );
}
