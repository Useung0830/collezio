type HeaderActionsSkeletonProps = {
  isMobile?: boolean;
};

export default function HeaderActionsSkeleton({
  isMobile = false,
}: HeaderActionsSkeletonProps) {
  return (
    <div role="status" className="flex items-center justify-end gap-5">
      <span className="sr-only">로그인 상태를 확인하고 있습니다.</span>
      <span
        aria-hidden="true"
        className={`bg-black-100 rounded-full motion-safe:animate-pulse ${isMobile ? "size-6" : "size-5"}`}
      />
      <span
        aria-hidden="true"
        className={`bg-black-100 rounded-full motion-safe:animate-pulse ${isMobile ? "size-6" : "size-8"}`}
      />
    </div>
  );
}
