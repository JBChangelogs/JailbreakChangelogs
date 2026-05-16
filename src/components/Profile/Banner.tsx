import { useState } from "react";
import Image from "next/image";
import { UserSettingsV2 } from "@/types/auth";
import { getBackgroundImageByIndex } from "@/utils/helpers/fisherYatesShuffle";

interface BannerProps {
  userId: string;
  username: string;
  banner?: string;
  customBanner?: string;
  settings?: UserSettingsV2;
  premiumType?: number;
}

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
  const fallbackBanner = getBackgroundImageByIndex(seed);

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

    // Custom banner: enabled, has premium, and has a valid URL
    if (
      settings?.custom_banner === true &&
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

    // Default: Discord banner
    if (banner && banner !== "None") {
      return {
        src: getBannerUrl(userId, banner),
        alt: "Profile banner",
        onError: handleBannerError,
      };
    }

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
        priority // Add priority since banners are usually above fold or critical
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
