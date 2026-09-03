import UserContentHistory from "@/features/community/components/UserContentHistory";
import ProfileSummary from "@/features/user/components/ProfileSummary";

export default function PostsPage() {
  return (
    <div className="flex w-full flex-col gap-7">
      <ProfileSummary />
      <UserContentHistory />
    </div>
  );
}
