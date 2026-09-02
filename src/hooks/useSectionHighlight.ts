"use client";

import { useEffect, useState } from "react";
import { useQueryState } from "nuqs";
import { toast } from "sonner";

export function useSectionHighlight() {
  const [highlightParam, setHighlightParam] = useQueryState("highlight", {
    defaultValue: "",
    history: "push",
    shallow: true,
  });
  const [showHighlight, setShowHighlight] = useState(false);
  const [highlightSetting, setHighlightSetting] = useState<string | null>(null);

  useEffect(() => {
    if (!highlightParam) return;

    const timer = window.setTimeout(() => {
      setHighlightSetting(highlightParam);
      setShowHighlight(true);
    }, 0);

    const clearTimer = window.setTimeout(() => {
      setShowHighlight(false);
      setHighlightSetting(null);
      void setHighlightParam(null);
    }, 10000);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(clearTimer);
    };
  }, [highlightParam, setHighlightParam]);

  const copySectionLink = (sectionId: string, sectionTitle: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("highlight", sectionId);
    void setHighlightParam(sectionId);
    navigator.clipboard.writeText(url.toString());
    toast.success("Link Copied", {
      description: `The URL for the "${sectionTitle}" section is now on your clipboard.`,
    });
  };

  const getSectionHighlightStyle = (sectionId: string) =>
    highlightSetting === sectionId && showHighlight
      ? {
          backgroundColor:
            "color-mix(in srgb, var(--color-button-info), transparent 80%)",
          transition: "background-color 0.5s ease",
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
          block: "center",
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
