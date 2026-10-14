import { useEffect, useState, useSyncExternalStore } from "react";

import { HOME_BANNER_INTERVAL_MS } from "@/features/home/constants/homeBanners";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function getVisibility() {
  return !document.hidden;
}

function getServerSnapshot() {
  return false;
}

export default function useBannerRotation(count: number) {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getServerSnapshot,
  );
  const isVisible = useSyncExternalStore(
    subscribeVisibility,
    getVisibility,
    getServerSnapshot,
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [shouldPlay, setShouldPlay] = useState<boolean | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isPlaying = shouldPlay ?? !prefersReducedMotion;

  const handleSelect = (index: number) => {
    setActiveIndex((index + count) % count);
    setShouldPlay(false);
  };

  const handlePause = () => setShouldPlay(false);
  const handleTogglePlayback = () => setShouldPlay(!isPlaying);

  useEffect(() => {
    if (!isPlaying || isHovered || !isVisible || count < 2) return;

    const timeout = window.setTimeout(() => {
      setActiveIndex((index) => (index + 1) % count);
    }, HOME_BANNER_INTERVAL_MS);

    return () => window.clearTimeout(timeout);
  }, [activeIndex, count, isHovered, isPlaying, isVisible]);

  return {
    activeIndex,
    isPlaying,
    handleSelect,
    handlePause,
    handleTogglePlayback,
    setIsHovered,
  };
}
