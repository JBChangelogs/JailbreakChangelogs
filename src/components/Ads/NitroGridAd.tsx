"use client";

import { canHideAdsForPremiumType } from "@/utils/auth/supporterAccess";
import { useEffect, useRef } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useAuthContext } from "@/contexts/AuthContext";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");

interface NitroGridAdProps {
  adId: string;
  className?: string;
}

export default function NitroGridAd({ adId, className }: NitroGridAdProps) {
  const { user, isLoading } = useAuthContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const createdRef = useRef(false);

  const tallViewport = useMediaQuery("(min-height: 600px)");
  const tier = user?.premiumtype ?? 0;
  const isSupporter = canHideAdsForPremiumType(tier);

  useEffect(() => {
    if (isLoading) return;

    if (isSupporter) {
      const el = document.getElementById(adId);
      if (el) el.remove();
      return;
    }

    if (createdRef.current) return;
    if (typeof window === "undefined") return;
    let active = true;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Element is in view, create the ad
            if (!createdRef.current && window.nitroAds?.createAd) {
              createdRef.current = true;
              try {
                // Wrap in try-catch per Nitropay best practices
                Promise.resolve(
                  window.nitroAds.createAd(adId, {
                    sizes: [
                      ["320", "50"],
                      ["320", "100"],
                      ...(tallViewport ? [["300", "250"]] : []),
                    ],
                    report: {
                      enabled: true,
                      icon: true,
                      wording: "Report Ad",
                      position: "top-right",
                    },
                    mediaQuery: "(min-width: 320px) and (max-width: 767px)",
                  }),
                )
                  .then((adInstance) => {
                    if (!active) return;
                    if (adInstance) {
                      observer.disconnect();
                    } else {
                      createdRef.current = false;
                    }
                  })
                  .catch((error) => {
                    log.warn(`[Nitro Ad] Failed to create ad ${adId}:`, error);
                    if (active) createdRef.current = false;
                  });
              } catch (error) {
                // Catch synchronous errors
                log.warn(`[Nitro Ad] Error initializing ad ${adId}:`, error);
                createdRef.current = false;
              }
            }
          }
        });
      },
      { rootMargin: "200px" }, // Start loading 200px before it comes into view
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    const retryWhenLoaded = () => {
      if (!createdRef.current && containerRef.current) {
        observer.unobserve(containerRef.current);
        observer.observe(containerRef.current);
      }
    };
    document.addEventListener("nitroAds.loaded", retryWhenLoaded);

    return () => {
      active = false;
      document.removeEventListener("nitroAds.loaded", retryWhenLoaded);
      observer.disconnect();
      // Cleanup: Remove the ad when component unmounts
      const ads = window.nitroAds as unknown as {
        removeAd?: (id: string) => void;
      };
      ads?.removeAd?.(adId);
      createdRef.current = false;
    };
  }, [isLoading, isSupporter, adId, tallViewport]);

  if (isLoading || isSupporter) {
    return null;
  }

  // Reserve space for the largest eligible mobile creative.
  return (
    <div
      id={adId}
      ref={containerRef}
      className={`flex justify-center ${className || ""}`}
      style={{ minHeight: tallViewport ? 250 : 100 }}
    />
  );
}
