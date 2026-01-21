import { useState } from "react";
import Image from "next/image";
import { UserSettings } from "@/types/auth";

interface BannerProps {
  userId: string;
  username: string;
  banner?: string;
  customBanner?: string;
  settings?: UserSettings;
  premiumType?: number;
}

// Move static data outside component
const BACKGROUND_COUNT = 42;
const BACKGROUNDS = Array.from(
  { length: BACKGROUND_COUNT },
  (_, i) =>
    `https://assets.jailbreakchangelogs.xyz/assets/backgrounds/background${i + 1}.webp`,
);

// Optimized seed calculation - converts string to number more efficiently
const calculateSeed = (userId: string): number => {
  let seed = 0;
  for (let i = 0; i < userId.length; i++) {
    seed = (seed << 5) - seed + userId.charCodeAt(i);
    seed = seed & seed; // Convert to 32-bit integer
  }
  return Math.abs(seed);
};

const getBannerUrl = (userId: string, bannerHash: string) => {
  return `https://cdn.discordapp.com/banners/${userId}/${bannerHash}?size=4096`;
};

export const Banner = ({
  userId,
  username,
  banner,
  customBanner,
  settings,
  premiumType,
}: BannerProps) => {
  const [primaryBannerFailed, setPrimaryBannerFailed] = useState(false);

  // Calculate fallback banner during render
  const seed = calculateSeed(userId);
  const index = seed % BACKGROUND_COUNT;
  const fallbackBanner = BACKGROUNDS[index];

  const handleBannerError = () => {
    setPrimaryBannerFailed(true);
  };

  const getBannerSource = () => {
    // If primary banner failed to load, use calculated fallback
    if (primaryBannerFailed) {
      return {
        src: fallbackBanner,
        alt: "Profile banner",
      };
    }

    // If user wants to use Discord banner
    if (settings?.banner_discord === 1) {
      // Only show Discord banner if it exists and is not "None"
      if (banner && banner !== "None") {
        return {
          src: getBannerUrl(userId, banner),
          alt: "Profile banner",
          onError: handleBannerError,
        };
      }
      // If no Discord banner available, use the calculated fallback
      return {
        src: fallbackBanner,
        alt: "Profile banner",
      };
    }

    // If user has explicitly chosen to use custom banner (Discord toggle off)
    // BUT only if they have Tier 2+ (custom banners require Tier 2+)
    if (
      settings?.banner_discord === 0 &&
      premiumType &&
      premiumType >= 2 &&
      customBanner &&
      customBanner !== "N/A"
    ) {
      return {
        src: customBanner,
        alt: "Profile banner",
        onError: handleBannerError,
      };
    }

    // If user is Tier 1 or below but has custom banner setting, fall back to Discord banner
    if (settings?.banner_discord === 0 && (!premiumType || premiumType < 2)) {
      // Only show Discord banner if it exists and is not "None"
      if (banner && banner !== "None") {
        return {
          src: getBannerUrl(userId, banner),
          alt: "Profile banner",
          onError: handleBannerError,
        };
      }
    }

    // Default to the calculated fallback
    return {
      src: fallbackBanner,
      alt: "Profile banner",
    };
  };

  return (
    <div className="relative h-48 md:h-80" key={userId}>
      <Image
        {...getBannerSource()}
        fill
        fetchPriority="high"
        draggable={false}
        className="z-0 object-cover"
        alt={`${username}'s profile banner`}
      />
      {/* Dark gradient overlay at the bottom for better text readability */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 30%, transparent 70%)",
        }}
      />
    </div>
  );
};
