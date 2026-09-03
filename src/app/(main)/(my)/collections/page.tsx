import MatchingHistory from "@/features/matching/components/MatchingHistory";
import ProfileSummary from "@/features/user/components/ProfileSummary";

export default function CollectionsPage() {
  return (
    <div className="flex w-full flex-col gap-8">
      <ProfileSummary />
      <MatchingHistory />
    </div>
  );
}
