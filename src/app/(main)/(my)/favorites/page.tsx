import FavoriteProductList from "@/features/favorite/components/FavoriteProductList";
import ProfileSummary from "@/features/user/components/ProfileSummary";

export default function FavoritesPage() {
  return (
    <div className="flex w-full flex-col gap-7">
      <ProfileSummary />
      <FavoriteProductList />
    </div>
  );
}
