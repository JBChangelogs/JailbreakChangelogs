import { useState } from "react";
import Image from "next/image";
import { IMAGE_PLACEHOLDER } from "@/utils/ui/imagePlaceholder";
import { cn } from "@/lib/utils";
import {
  PROFILE_BANNER_HEIGHT,
  useProfileBannerAspectRatio,
} from "@/hooks/useProfileBannerAspectRatio";
import { getBackgroundImageByIndex } from "@/utils/helpers/backgroundImages";
import { ImageLightbox } from "@/components/ui/ImageLightbox";

interface BannerProps {
  userId: string;
  username: string;
  bannerUrl?: string | null;
  className?: string;
  preview?: boolean;
  expandable?: boolean;
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

/** Keeps the site's decorative background separate from the user's banner. */
export function getProfileBanner({
  userId,
  bannerUrl,
}: {
  userId: string;
  bannerUrl?: string | null;
}) {
  return {
    primary: bannerUrl ?? null,
    fallback: getBackgroundImageByIndex(calculateSeed(userId)),
  };
}

export const Banner = ({
  userId,
  username,
  bannerUrl,
  className,
  preview = false,
  expandable = false,
}: BannerProps) => {
  const previewAspectRatio = useProfileBannerAspectRatio(preview);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const { primary, fallback } = getProfileBanner({ userId, bannerUrl });
  const primaryBannerFailed = primary === failedUrl;
  const src = primary && !primaryBannerFailed ? primary : fallback;

  return (
    <div
      className={cn(
        "relative",
        PROFILE_BANNER_HEIGHT,
        preview && previewAspectRatio ? "h-auto md:h-auto" : undefined,
        className,
      )}
      style={
        preview ? { aspectRatio: previewAspectRatio ?? undefined } : undefined
      }
      key={userId}
    >
      <Image
        placeholder={IMAGE_PLACEHOLDER}
        src={src}
        onError={src === primary ? () => setFailedUrl(primary) : undefined}
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
      {expandable && primary && !primaryBannerFailed && (
        <ImageLightbox
          src={primary}
          alt={`${username}'s profile banner`}
          previewRadius="rounded-none"
          className="absolute! inset-0 z-20"
        >
          {null}
        </ImageLightbox>
      )}
    </div>
  );
};
