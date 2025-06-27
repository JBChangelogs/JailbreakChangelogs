import { useState, useEffect } from 'react';
import Image from 'next/image';
import { UserSettings } from '@/types/auth';

interface BannerProps {
  userId: string;
  username: string;
  banner?: string;
  customBanner?: string;
  settings?: UserSettings;
}

// Move static data outside component
const BACKGROUND_COUNT = 19;
const BACKGROUNDS = Array.from(
  { length: BACKGROUND_COUNT },
  (_, i) => `https://assets.jailbreakchangelogs.xyz/assets/backgrounds/background${i + 1}.webp`
);

// Optimized seed calculation - converts string to number more efficiently
const calculateSeed = (userId: string): number => {
  let seed = 0;
  for (let i = 0; i < userId.length; i++) {
    seed = ((seed << 5) - seed) + userId.charCodeAt(i);
    seed = seed & seed; // Convert to 32-bit integer
  }
  return Math.abs(seed);
};

const getBannerUrl = (userId: string, bannerHash: string) => {
  return `https://cdn.discordapp.com/banners/${userId}/${bannerHash}?size=4096`;
};

export const Banner = ({ userId, username, banner, customBanner, settings }: BannerProps) => {
  const [fallbackBanner, setFallbackBanner] = useState<string | null>(null);
  const [primaryBannerFailed, setPrimaryBannerFailed] = useState(false);

  // Memoize the background selection
  useEffect(() => {
    const seed = calculateSeed(userId);
    const index = seed % BACKGROUND_COUNT;
    setFallbackBanner(BACKGROUNDS[index]);
  }, [userId]);

  const handleBannerError = () => {
    setPrimaryBannerFailed(true);
  };

  const getBannerSource = () => {
    // If primary banner failed to load, use fallback
    if (primaryBannerFailed) {
      return {
        src: fallbackBanner || '/assets/backgrounds/background1.webp',
        alt: "Profile banner",
        unoptimized: true
      };
    }

    // If user wants to use Discord banner
    if (settings?.banner_discord === 1) {
      // Only show Discord banner if it exists and is not "None"
      if (banner && banner !== "None") {
        return {
          src: getBannerUrl(userId, banner),
          alt: "Profile banner",
          unoptimized: true,
          onError: handleBannerError
        };
      }
      // If no Discord banner available, use the stable fallback
      return {
        src: fallbackBanner || '/assets/backgrounds/background1.webp',
        alt: "Profile banner",
        unoptimized: true
      };
    }

    // If user has explicitly chosen to use custom banner (Discord toggle off)
    if (settings?.banner_discord === 0 && customBanner && customBanner !== "N/A") {
      return {
        src: customBanner,
        alt: "Profile banner",
        unoptimized: true,
        onError: handleBannerError
      };
    }

    // Default to the stable fallback
    return {
      src: fallbackBanner || '/assets/backgrounds/background1.webp',
      alt: "Profile banner",
      unoptimized: true
    };
  };

  // Reset primaryBannerFailed when userId changes
  useEffect(() => {
    setPrimaryBannerFailed(false);
  }, [userId]);

  return (
    <div className="relative h-48 md:h-80 bg-[#2E3944]">
      <Image
        {...getBannerSource()}
        fill
        priority
        draggable={false}
        className="object-cover"
        alt={`${username}'s profile banner`}
      />
    </div>
  );
}; 