import type { Metadata } from "next";

import CompletedTradeList from "@/features/review/components/CompletedTradeList";
import ReviewTagSummary from "@/features/review/components/ReviewTagSummary";
import ProfileSummary from "@/features/user/components/ProfileSummary";

export const metadata: Metadata = {
  title: "거래 후기",
  description: "거래 후기와 거래 완료 목록을 확인하는 페이지입니다.",
};

export default function ReviewsPage() {
  return (
    <div className="flex w-full flex-col gap-12">
      <ProfileSummary />
      <ReviewTagSummary />
      <CompletedTradeList />
    </div>
  );
}
