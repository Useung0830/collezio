import CompletedTradeList from "@/features/review/components/CompletedTradeList";
import ReviewTagSummary from "@/features/review/components/ReviewTagSummary";
import ProfileSummary from "@/features/user/components/ProfileSummary";

export default function ReviewsPage() {
  return (
    <div className="flex w-full flex-col gap-12">
      <ProfileSummary />
      <ReviewTagSummary />
      <CompletedTradeList />
    </div>
  );
}
