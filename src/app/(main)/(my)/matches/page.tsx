import MatchHistoryList from "@/features/matching/components/MatchHistoryList";
import ProfileSummary from "@/features/user/components/ProfileSummary";

export default function MatchesPage() {
  return (
    <div className="flex w-full flex-col gap-7">
      <ProfileSummary />
      <MatchHistoryList />
    </div>
  );
}
