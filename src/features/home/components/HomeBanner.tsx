"use client";

import HomeBannerControls from "@/features/home/components/HomeBannerControls";
import { HOME_BANNERS } from "@/features/home/constants/homeBanners";
import useBannerRotation from "@/features/home/hooks/useBannerRotation";

import styles from "./home-banner.module.css";

export default function HomeBanner() {
  const {
    activeIndex,
    isPlaying,
    handleSelect,
    handlePause,
    handleTogglePlayback,
    setIsHovered,
  } = useBannerRotation(HOME_BANNERS.length);
  const activeBanner = HOME_BANNERS[activeIndex];

  return (
    <section
      aria-labelledby="home-banner-title"
      aria-roledescription="캐러셀"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={(event) => {
        if (!event.target.closest("[data-banner-playback]")) handlePause();
      }}
      className="text-black-900 relative isolate flex aspect-4/5 min-h-110 flex-col overflow-hidden rounded-3xl bg-[#eef0ff] px-6 pt-7 pb-20 md:aspect-auto md:min-h-80 md:justify-center md:px-10 md:pt-10 md:pb-20 lg:px-20"
    >
      {HOME_BANNERS.map((banner, index) => (
        <div
          key={banner.id}
          aria-hidden="true"
          className={`${styles.background} ${styles[banner.id]} ${activeIndex === index ? styles.active : ""}`}
        />
      ))}
      <h1 id="home-banner-title" className="text-banner-title">
        {activeBanner.title[0]}
        <br />
        <span className="text-brand-blue">{activeBanner.title[1]}</span>
      </h1>
      <p className="text-banner-description text-black-600 mt-4 lg:mt-6">
        {activeBanner.description[0]}
        <br />
        {activeBanner.description[1]}
      </p>
      <HomeBannerControls
        activeIndex={activeIndex}
        isPlaying={isPlaying}
        onSelect={handleSelect}
        onTogglePlayback={handleTogglePlayback}
      />
    </section>
  );
}
