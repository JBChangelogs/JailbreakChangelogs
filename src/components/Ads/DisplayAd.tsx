"use client";
import React, { useEffect } from "react";

interface DisplayAdProps {
  adSlot: string;
  style?: React.CSSProperties;
  className?: string;
  adFormat?: string; // e.g., "auto" or "fluid"
  layoutKey?: string; // for in-feed ads
}

const DisplayAd: React.FC<DisplayAdProps> = ({
  adSlot,
  style = { display: "block" },
  className = "",
  adFormat = "auto",
  layoutKey,
}) => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ignore if AdSense is blocked
    }
  }, []);

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={style}
      data-ad-client="ca-pub-8152532464536367"
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      {...(layoutKey ? { "data-ad-layout-key": layoutKey } : {})}
      data-full-width-responsive={adFormat === "auto" ? "true" : undefined}
    />
  );
};

export default DisplayAd; 