import HomeBanner from "@/features/home/components/HomeBanner";
import HomeProductSections from "@/features/home/components/HomeProductSections";

export default function Home() {
  return (
    <div className="m-auto flex max-w-280 flex-col gap-12 pb-16 md:gap-20 md:pb-24 lg:gap-24 lg:pb-32">
      <HomeBanner />
      <HomeProductSections />
    </div>
  );
}
