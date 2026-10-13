import { HOME_BANNERS } from "@/features/home/constants/homeBanners";

import PauseIcon from "@/assets/icons/icon-pause.svg";
import PlayIcon from "@/assets/icons/icon-play.svg";

interface HomeBannerControlsProps {
  activeIndex: number;
  isPlaying: boolean;
  onSelect: (index: number) => void;
  onTogglePlayback: () => void;
}

export default function HomeBannerControls({
  activeIndex,
  isPlaying,
  onSelect,
  onTogglePlayback,
}: HomeBannerControlsProps) {
  return (
    <div
      role="group"
      aria-label="배너 조작"
      className="text-black-900 absolute bottom-5 left-1/2 z-10 -translate-x-1/2"
    >
      <button
        type="button"
        data-banner-playback
        aria-label={isPlaying ? "배너 자동 전환 정지" : "배너 자동 전환 재생"}
        onClick={onTogglePlayback}
        className="text-black-400 focus-visible:outline-brand-blue absolute top-1/2 right-full mr-1 flex size-10 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-2"
      >
        {isPlaying ? (
          <PauseIcon className="size-4" aria-hidden="true" />
        ) : (
          <PlayIcon className="size-4" aria-hidden="true" />
        )}
      </button>
      <div className="flex items-center">
        {HOME_BANNERS.map((banner, index) => (
          <button
            key={banner.id}
            type="button"
            aria-label={`${index + 1}번 배너: ${banner.label}`}
            aria-current={activeIndex === index ? "true" : undefined}
            onClick={() => onSelect(index)}
            className="focus-visible:outline-brand-blue flex h-9 w-6 items-center justify-center rounded-full focus-visible:outline-2"
          >
            <span
              className={`h-1.5 rounded-full ${activeIndex === index ? "bg-brand-blue w-4" : "bg-black-300 w-1.5"}`}
            />
          </button>
        ))}
      </div>
      <span className="sr-only" aria-live={isPlaying ? "off" : "polite"}>
        {HOME_BANNERS.length}개 중 {activeIndex + 1}번째 배너:{" "}
        {HOME_BANNERS[activeIndex].label}
      </span>
    </div>
  );
}
