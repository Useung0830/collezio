import NewProductList from "@/features/products/components/NewProductList";
import PopularProductList from "@/features/products/components/PopularProductList";

import bannerImage from "@/assets/images/ad-banner-main.jpg";

export default function Home() {
  return (
    <div className="m-auto flex max-w-280 flex-col gap-20">
      <section
        style={{ backgroundImage: `url(${bannerImage.src})` }}
        className="relative flex h-80 items-center rounded-3xl bg-cover bg-center"
      />
      <PopularProductList />
      <NewProductList />
    </div>
  );
}
