import type { Metadata } from "next";

import FavoriteProductList from "@/features/favorite/components/FavoriteProductList";
import ProfileSummary from "@/features/user/components/ProfileSummary";

export const metadata: Metadata = {
  title: "찜한 컬렉션",
  description: "관심 있는 소장품을 모아보고 상세 정보를 다시 확인해보세요.",
};

export default function FavoritesPage() {
  return (
    <div className="flex w-full flex-col gap-7">
      <ProfileSummary />
      <FavoriteProductList />
    </div>
  );
}
