import { reviewTags } from "@/features/review/mocks/reviews";

const TOTAL_REVIEW_COUNT = 24;

export default function ReviewTagSummary() {
  return (
    <section aria-labelledby="review-summary-title">
      <div className="mb-3">
        <h2
          id="review-summary-title"
          className="text-heading-20 text-black-900"
        >
          거래 후기
        </h2>
        <p className="text-label-14 text-black-600 mt-1">
          {TOTAL_REVIEW_COUNT}개의 후기를 받았어요
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {reviewTags.map((tag) => (
          <li
            key={tag.id}
            className="bg-black-100 text-label-14 text-black-900 flex min-h-9 items-center justify-center gap-2 rounded-full px-4 py-2 text-center"
          >
            <span>{tag.label}</span>
            <span>{tag.count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
