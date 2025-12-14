"use client";

import { useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

const VIDEO_PLAYER_ID = "np-video-player";

export default function NitroVideoPlayer() {
  const { user } = useAuthContext();
  const createdRef = useRef(false);

  useEffect(() => {
    const tier = user?.premiumtype ?? 0;
    const isSupporter = tier >= 1 && tier <= 3;

    if (isSupporter) {
      const removeAd = () => {
        const el = document.getElementById(VIDEO_PLAYER_ID);
        if (el) {
          el.remove();
        }
      };

      removeAd();

      const observer = new MutationObserver(() => {
        removeAd();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      createdRef.current = false;
      return () => {
        observer.disconnect();
      };
    }

    if (createdRef.current) return;
    if (typeof window === "undefined") return;
    if (!window.nitroAds?.createAd) return;

    createdRef.current = true;

    Promise.resolve(
      (function ensureContainerAndCreate() {
        // Ensure a container element exists for the video player format
        let el = document.getElementById(VIDEO_PLAYER_ID);
        if (!el) {
          el = document.createElement("div");
          el.id = VIDEO_PLAYER_ID;
          document.body.appendChild(el);
        }

        return window.nitroAds.createAd(VIDEO_PLAYER_ID, {
          format: "video-nc",
          mediaQuery:
            "(min-width: 1025px), (min-width: 768px) and (max-width: 1024px), (min-width: 320px) and (max-width: 767px)",
          video: {
            initialDelay: 3,
            // Encourage full UI on mobile and avoid sticky minimized state across views
            mobile: "full",
            persistMinimizeTime: 0,
          },
        });
      })(),
    ).catch(() => {
      createdRef.current = false;
    });
  }, [user?.premiumtype]);

  return null;
}
