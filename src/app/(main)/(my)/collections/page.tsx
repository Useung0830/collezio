import type { Metadata } from "next";

import MyProductListGate from "@/features/products/components/MyProductListGate";
import ProfileSummary from "@/features/user/components/ProfileSummary";

export const metadata: Metadata = {
  title: "보유품 목록",
  description: "내가 등록한 소장품과 교환 상태를 확인해보세요.",
};

export default function CollectionsPage() {
  return (
    <div className="flex w-full flex-col gap-8">
      <ProfileSummary />
      <MyProductListGate />
    </div>
  );
}
