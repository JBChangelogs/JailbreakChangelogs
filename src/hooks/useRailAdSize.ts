"use client";

import { useLayoutEffect, useState } from "react";

export function useRailAdSize() {
  const [size, setSize] = useState<"none" | "small" | "wide">("none");

  useLayoutEffect(() => {
    const main = document.querySelector<HTMLElement>(".site-layout > main");
    if (!main) return;
    const update = () => {
      const width = main.getBoundingClientRect().width;
      // Keep the 1536px page container plus two 180px or 340px ad gutters.
      setSize(width >= 2216 ? "wide" : width >= 1896 ? "small" : "none");
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(main, { box: "border-box" });
    return () => observer.disconnect();
  }, []);

  return size;
}
