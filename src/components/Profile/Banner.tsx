import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { UserSettingsV2 } from "@/types/auth";
import { getBackgroundImageByIndex } from "@/utils/helpers/fisherYatesShuffle";

interface BannerProps {
  userId: string;
  username: string;
  banner?: string;
  customBanner?: string;
  settings?: UserSettingsV2;
  premiumType?: number;
  className?: string;
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

interface ProfileBannerOptions {
  userId: string;
  banner?: string | null;
  customBanner?: string | null;
  settings?: UserSettingsV2;
  premiumType?: number;
  /** Discord CDN size for the banner image. */
  size?: number;
}

/**
 * Picks a user's banner: their custom banner when they've turned it on and
 * have premium 2+, otherwise their Discord banner. `fallback` is a background
 * chosen from the user ID, for users with neither or when `primary` fails.
 */
export function getProfileBanner({
  userId,
  banner,
  customBanner,
  settings,
  premiumType,
  size = 4096,
}: ProfileBannerOptions) {
  const fallback = getBackgroundImageByIndex(calculateSeed(userId));
  if (
    settings?.custom_banner === true &&
    premiumType &&
    premiumType >= 2 &&
    customBanner &&
    customBanner !== "N/A"
  ) {
    return { primary: customBanner, fallback };
  }
  if (banner && banner !== "None") {
    // /v2/users/me returns a full URL; other endpoints return just the hash.
    return {
      primary: /^https?:\/\//i.test(banner)
        ? banner
        : `https://cdn.discordapp.com/banners/${userId}/${banner}?size=${size}`,
      fallback,
    };
  }
  return { primary: null, fallback };
}

export const Banner = ({
  userId,
  username,
  banner,
  customBanner,
  settings,
  premiumType,
  className,
}: BannerProps) => {
  const [primaryBannerFailed, setPrimaryBannerFailed] = useState(false);
  const { primary, fallback } = getProfileBanner({
    userId,
    banner,
    customBanner,
    settings,
    premiumType,
  });
  const src = primary && !primaryBannerFailed ? primary : fallback;

  return (
    <div className={cn("relative h-40 md:h-70", className)} key={userId}>
      <Image
        src={src}
        onError={
          src === primary ? () => setPrimaryBannerFailed(true) : undefined
        }
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
            "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 35%, transparent 75%)",
        }}
      />
    </div>
  );
};
