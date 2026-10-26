"use client";

import { useLayoutEffect, useState } from "react";

export function useProfileBackgroundAspectRatio(enabled: boolean) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!enabled) return;
    const main = document.querySelector<HTMLElement>(".site-layout > main");
    if (!main) return;

    // Measure the same fixed frame even before the first background is uploaded.
    const frame = document.createElement("div");
    frame.className =
      "pointer-events-none invisible fixed top-(--header-height) right-0 bottom-0 left-[var(--desktop-sidebar-width,0px)] min-[1536px]:motion-safe:[transition:left_225ms_ease-out]";
    frame.setAttribute("aria-hidden", "true");
    main.append(frame);

    const update = () => {
      const { width, height } = frame.getBoundingClientRect();
      if (width > 0 && height > 0) setAspectRatio(width / height);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => {
      observer.disconnect();
      frame.remove();
    };
  }, [enabled]);

  return aspectRatio;
}
