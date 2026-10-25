"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function useSectionHighlight(ready = true) {
  const highlightParam = useSearchParams().get("highlight");
  const [highlightSetting, setHighlightSetting] = useState<string | null>(null);
  const showHighlight = highlightSetting !== null;

  useEffect(() => {
    if (!highlightParam || !ready) return;
    const pathname = window.location.pathname;

    const timer = window.setTimeout(() => {
      const url = new URL(window.location.href);
      if (
        url.pathname !== pathname ||
        url.searchParams.get("highlight") !== highlightParam
      )
        return;
      url.searchParams.delete("highlight");
      window.history.replaceState(null, "", url.toString());
      setHighlightSetting(highlightParam);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [highlightParam, ready]);

  useEffect(() => {
    if (!highlightSetting) return;
    const clearTimer = window.setTimeout(() => {
      setHighlightSetting(null);
    }, 3000);

    return () => window.clearTimeout(clearTimer);
  }, [highlightSetting]);

  const copySectionLink = (sectionId: string, sectionTitle: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("highlight", sectionId);
    navigator.clipboard.writeText(url.toString());
    toast.success("Link Copied", {
      description: `The URL for the "${sectionTitle}" section is now on your clipboard.`,
    });
  };

  const getSectionHighlightStyle = (sectionId: string) =>
    highlightSetting === sectionId && showHighlight
      ? {
          // A light touch: a faint tint and an accent border, not a full fill.
          backgroundColor:
            "color-mix(in srgb, var(--color-button-info), transparent 94%)",
          borderColor:
            "color-mix(in srgb, var(--color-button-info), transparent 50%)",
        }
      : undefined;

  const scrollHighlightedSectionIntoView = (
    sectionId: string,
    el: HTMLElement | null,
  ) => {
    if (highlightSetting === sectionId && showHighlight && el) {
      setTimeout(() => {
        el.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  };

  return {
    highlightSetting,
    showHighlight,
    copySectionLink,
    getSectionHighlightStyle,
    scrollHighlightedSectionIntoView,
  };
}
