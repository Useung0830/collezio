import bannerBackground from "@/assets/images/ad-banner-background.png";

export default function HomeBanner() {
  return (
    <section
      aria-labelledby="home-banner-title"
      style={{ backgroundImage: `url(${bannerBackground.src})` }}
      className="text-black-900 flex min-h-100 flex-col rounded-3xl bg-[#eef0ff] bg-[length:auto_220px] bg-right-bottom bg-no-repeat px-6 pt-7 pb-56 md:min-h-80 md:justify-center md:bg-cover md:bg-center md:px-10 md:py-10 lg:px-20"
    >
      <h1 id="home-banner-title" className="text-banner-title">
        소중한 컬렉션을
        <br />
        <span className="text-brand-blue">교환</span>으로{" "}
        <span className="text-brand-green">연결</span>하다
      </h1>
      <p className="text-banner-description text-black-600 mt-4 lg:mt-6">
        피규어, 카드, 굿즈까지.
        <br />
        당신의 컬렉션이 완성되는 곳,{" "}
        <span className="text-brand-blue">Collezio</span>
      </p>
    </section>
  );
}
