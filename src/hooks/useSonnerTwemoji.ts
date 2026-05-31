"use client";

import { useEffect } from "react";
import twemoji from "@twemoji/api";
import { useTwemoji } from "@/contexts/TwemojiContext";

const TWEMOJI_OPTIONS = { className: "twemoji" } as const;

function parseSonnerToastEmojis(root: ParentNode) {
  root.querySelectorAll("[data-sonner-toast]").forEach((toast) => {
    if (toast instanceof HTMLElement) {
      twemoji.parse(toast, TWEMOJI_OPTIONS);
    }
  });
}

export function useSonnerTwemoji() {
  const { twemojiEnabled } = useTwemoji();

  useEffect(() => {
    if (!twemojiEnabled) return;

    let rafId = 0;
    const scheduleParse = (root: ParentNode) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => parseSonnerToastEmojis(root));
      });
    };

    const attach = (toaster: Element) => {
      scheduleParse(toaster);
      const observer = new MutationObserver(() => scheduleParse(toaster));
      observer.observe(toaster, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      return () => {
        observer.disconnect();
        cancelAnimationFrame(rafId);
      };
    };

    const existing = document.querySelector("[data-sonner-toaster]");
    if (existing) {
      return attach(existing);
    }

    const bodyObserver = new MutationObserver(() => {
      const toaster = document.querySelector("[data-sonner-toaster]");
      if (!toaster) return;
      bodyObserver.disconnect();
      cleanup = attach(toaster);
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });

    let cleanup: (() => void) | undefined;

    return () => {
      bodyObserver.disconnect();
      cleanup?.();
      cancelAnimationFrame(rafId);
    };
  }, [twemojiEnabled]);
}
