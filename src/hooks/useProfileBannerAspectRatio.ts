"use client";

import { useLayoutEffect, useState } from "react";

export const PROFILE_BANNER_HEIGHT = "h-40 md:h-70";

export function useProfileBannerAspectRatio(enabled = true) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!enabled) return;
    const main = document.querySelector<HTMLElement>(".site-layout > main");
    if (!main) return;

    // Measure the profile layout, rather than the narrower settings card.
    const probe = document.createElement("div");
    probe.className = "pointer-events-none invisible h-0 overflow-hidden";
    probe.setAttribute("aria-hidden", "true");
    const container = document.createElement("div");
    container.className = "container mx-auto max-w-7xl";
    const card = document.createElement("div");
    card.className = "mx-3 border sm:mx-0";
    const banner = document.createElement("div");
    banner.className = PROFILE_BANNER_HEIGHT;
    card.append(banner);
    container.append(card);
    probe.append(container);
    main.append(probe);

    const update = () => {
      const { width, height } = banner.getBoundingClientRect();
      if (width > 0 && height > 0) setAspectRatio(width / height);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(banner);
    return () => {
      observer.disconnect();
      probe.remove();
    };
  }, [enabled]);

  return aspectRatio;
}
