import HomeBanner from "@/features/home/components/HomeBanner";
import NewProductList from "@/features/products/components/NewProductList";
import PopularProductList from "@/features/products/components/PopularProductList";

export default function Home() {
  return (
    <div className="m-auto flex max-w-280 flex-col gap-12 pb-16 md:gap-20 md:pb-24 lg:gap-24 lg:pb-32">
      <HomeBanner />
      <PopularProductList />
      <NewProductList />
    </div>
  );
}
