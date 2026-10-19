import styles from "./productShowcase.module.css";

type ProductGridSkeletonProps = {
  count: number;
  title?: string;
  variant?: "showcase" | "compact-showcase" | "grid";
};

export default function ProductGridSkeleton({
  count,
  title,
  variant = "grid",
}: ProductGridSkeletonProps) {
  const isShowcase = variant !== "grid";
  const gridClassName =
    variant === "showcase"
      ? "grid-cols-2 gap-x-3 md:grid-cols-4"
      : variant === "compact-showcase"
        ? "grid-cols-2 gap-x-3 sm:grid-cols-3 lg:grid-cols-5"
        : "grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 xl:grid-cols-4";

  return (
    <section aria-label={title ?? "상품 목록"} role="status" aria-busy="true">
      <span className="sr-only">상품을 불러오고 있습니다.</span>
      {title && (
        <h2 className="text-heading-24 text-black-900 mb-4 md:mb-6">{title}</h2>
      )}
      <ul
        aria-hidden="true"
        className={`${isShowcase ? `${styles.cabinet} ${styles.openShowcase} ` : ""}grid ${gridClassName}`}
      >
        {Array.from({ length: count }, (_, index) => (
          <li
            key={index}
            className={isShowcase ? styles.compartment : "min-w-0"}
          >
            <div className="flex flex-col gap-3 sm:gap-4">
              <div
                className={`bg-black-100 motion-safe:animate-pulse ${isShowcase ? "aspect-[1/1.12] rounded-lg" : "aspect-square rounded-2xl"}`}
              />
              <div
                className={`flex flex-col gap-2 ${isShowcase ? "px-3 pt-2" : ""}`}
              >
                <div className="bg-black-100 h-5 w-4/5 rounded motion-safe:animate-pulse" />
                <div className="bg-black-100 h-7 w-2/3 rounded motion-safe:animate-pulse" />
                <div className="bg-black-100 h-4 w-1/2 rounded motion-safe:animate-pulse" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
