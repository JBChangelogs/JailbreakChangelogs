"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { warmEmbedImageUrl } from "@/lib/warmEmbed";

/** Warms the current page's og:image once the browser is idle. */
export default function EmbedWarmer() {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    const warm = () =>
      warmEmbedImageUrl(
        document
          .querySelector('meta[property="og:image"]')
          ?.getAttribute("content"),
      );
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(warm, { timeout: 5000 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(warm, 2000);
    return () => clearTimeout(id);
  }, [pathname, search]);

  return null;
}
