"use client";

import BoringAvatar from "boring-avatars";
import Image from "next/image";
import { IMAGE_PLACEHOLDER } from "@/utils/ui/imagePlaceholder";
import { memo, useState } from "react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  userId: string;
  avatarHash: string | null;
  username: string;
  size?: number;
  cdnSize?: number;
  custom_avatar?: string;
  forceAvatarUrl?: string;
  isOnline?: boolean;
  showBadge?: boolean;
  settings?: {
    custom_avatar?: boolean;
    hide_presence?: boolean;
  };
  shape?: "circle" | "square";
  premiumType?: number;
  className?: string;
  bgClassName?: string;
  presenceBadgeClassName?: string;
}

export const DefaultAvatar = ({
  premiumType,
  shape = "circle",
  name = "?",
}: {
  premiumType?: number;
  shape?: "circle" | "square";
  name?: string | null;
} = {}) => {
  const finalShape = premiumType === 3 ? "square" : shape;

  return (
    <BoringAvatar
      name={name ?? "?"}
      variant="beam"
      size="100%"
      square={finalShape === "square"}
      colors={["#0182FE", "#2CB57C", "#ED5050", "#66B3FF", "#95A1B2"]}
    />
  );
};

export const SilhouetteAvatar = () => (
  <svg
    className="text-tertiary-text h-full w-full"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid meet"
  >
    <circle cx="12" cy="12" r="12" fill="currentColor" />
    {/* Slightly inset the figure to avoid touching the outer edge at tiny sizes */}
    <g transform="translate(12,12) scale(0.92) translate(-12,-12)">
      <path
        d="M12 13.5C14.4853 13.5 16.5 11.4853 16.5 9C16.5 6.51472 14.4853 4.5 12 4.5C9.51472 4.5 7.5 6.51472 7.5 9C7.5 11.4853 9.51472 13.5 12 13.5Z"
        fill="#d3d9d4"
      />
      <path
        d="M12 15C8.13401 15 5 18.134 5 22H19C19 18.134 15.866 15 12 15Z"
        fill="#d3d9d4"
      />
    </g>
  </svg>
);

const AvatarWrapper = ({
  children,
  isOnline,
  showBadge,
  isHidden = false,
  size,
  isSquare,
  className,
  presenceBadgeClassName,
}: {
  children: React.ReactNode;
  isOnline?: boolean;
  showBadge?: boolean;
  isHidden?: boolean;
  size: number;
  isSquare: boolean;
  className?: string;
  presenceBadgeClassName?: string;
}) => {
  if (!showBadge) return <>{children}</>;

  const badgeSize = Math.min(32, Math.max(10, Math.round(size * 4 * 0.24)));
  const badgeOffset = isSquare
    ? -Math.max(3, Math.round(badgeSize * 0.25))
    : -Math.max(1, Math.round(badgeSize * 0.08));
  const badgeBorderWidth = badgeSize >= 20 ? 4 : 2;

  return (
    <div className={cn("relative z-20 w-fit shrink-0", className)}>
      {children}
      {isOnline && !isHidden ? (
        <span
          className={cn(
            "border-secondary-bg pointer-events-none absolute rounded-full",
            presenceBadgeClassName,
          )}
          style={{
            right: badgeOffset,
            bottom: badgeOffset,
            width: badgeSize,
            height: badgeSize,
            borderWidth: badgeBorderWidth,
            backgroundColor: "var(--color-status-success-vibrant)",
          }}
          aria-label="Online"
          title="Online"
        />
      ) : null}
    </div>
  );
};

const UserAvatarImpl = ({
  userId,
  avatarHash,
  username,
  size = 12,
  cdnSize,
  custom_avatar,
  forceAvatarUrl,
  isOnline,
  showBadge = true,
  settings,
  shape = "circle",
  premiumType,
  className,
  bgClassName = "bg-primary-bg",
  presenceBadgeClassName,
}: UserAvatarProps) => {
  const [imageError, setImageError] = useState(false);
  const [customAvatarError, setCustomAvatarError] = useState(false);

  const finalShape = premiumType === 3 ? "square" : shape;

  const discordCdnSize = (() => {
    const value = cdnSize ?? 4096;
    const allowed = new Set([16, 32, 64, 128, 256, 512, 1024, 2048, 4096]);
    return allowed.has(value) ? value : 4096;
  })();

  const getAvatarSource = () => {
    if (forceAvatarUrl && !imageError) {
      return {
        src: forceAvatarUrl,
        alt: username ? `${username}'s profile picture` : "User avatar",
        onError: () => setImageError(true),
      };
    }

    if (
      settings?.custom_avatar === true &&
      premiumType &&
      premiumType >= 2 &&
      custom_avatar &&
      custom_avatar !== "N/A" &&
      !customAvatarError
    ) {
      return {
        src: custom_avatar,
        alt: username ? `${username}'s profile picture` : "User avatar",
        onError: () => setCustomAvatarError(true),
      };
    }

    if (!imageError && avatarHash && avatarHash !== "None") {
      return {
        src: /^https?:\/\//i.test(avatarHash)
          ? avatarHash
          : `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}?size=${discordCdnSize}`,
        alt: username ? `${username}'s profile picture` : "User avatar",
        onError: () => setImageError(true),
      };
    }

    return null;
  };

  const avatarSource = getAvatarSource();

  // If showBadge is true, we pass className to wrapper.
  // If showBadge is false, we pass className to inner div.
  const wrapperClassName = showBadge ? className : undefined;
  const innerClassName = !showBadge ? className : undefined;

  const innerDivCommonClass = `relative border border-border-card ${
    finalShape === "circle"
      ? "rounded-full"
      : finalShape === "square" && premiumType === 3
        ? "rounded-[25%]"
        : finalShape === "square"
          ? "rounded-lg"
          : "rounded-full"
  } ${bgClassName} shrink-0 overflow-hidden ${innerClassName || ""}`;

  if (!avatarSource) {
    return (
      <AvatarWrapper
        isOnline={isOnline}
        showBadge={showBadge}
        isHidden={Boolean(settings?.hide_presence)}
        size={size}
        isSquare={finalShape === "square"}
        className={wrapperClassName}
        presenceBadgeClassName={presenceBadgeClassName}
      >
        <div
          className={innerDivCommonClass}
          style={{
            width: size * 4,
            height: size * 4,
            minWidth: size * 4,
            minHeight: size * 4,
          }}
        >
          <div className="flex h-full w-full items-center justify-center">
            <DefaultAvatar
              premiumType={premiumType}
              shape={shape}
              name={userId}
            />
          </div>
        </div>
      </AvatarWrapper>
    );
  }

  return (
    <AvatarWrapper
      isOnline={isOnline}
      showBadge={showBadge}
      isHidden={Boolean(settings?.hide_presence)}
      size={size}
      isSquare={finalShape === "square"}
      className={wrapperClassName}
      presenceBadgeClassName={presenceBadgeClassName}
    >
      <div
        className={innerDivCommonClass}
        style={{
          width: size * 4,
          height: size * 4,
          minWidth: size * 4,
          minHeight: size * 4,
        }}
      >
        <div className="absolute inset-0">
          <Image
            placeholder={IMAGE_PLACEHOLDER}
            src={avatarSource.src}
            alt={avatarSource.alt}
            fill
            fetchPriority="high"
            draggable={false}
            onError={avatarSource.onError}
            className="object-cover"
          />
        </div>
      </div>
    </AvatarWrapper>
  );
};

export const UserAvatar = memo(
  UserAvatarImpl,
  (prev, next) =>
    prev.userId === next.userId &&
    prev.avatarHash === next.avatarHash &&
    prev.forceAvatarUrl === next.forceAvatarUrl &&
    prev.username === next.username &&
    prev.size === next.size &&
    prev.custom_avatar === next.custom_avatar &&
    prev.isOnline === next.isOnline &&
    prev.showBadge === next.showBadge &&
    prev.shape === next.shape &&
    prev.premiumType === next.premiumType &&
    prev.className === next.className &&
    prev.presenceBadgeClassName === next.presenceBadgeClassName &&
    (prev.settings?.custom_avatar ?? null) ===
      (next.settings?.custom_avatar ?? null) &&
    (prev.settings?.hide_presence ?? null) ===
      (next.settings?.hide_presence ?? null),
);

UserAvatar.displayName = "UserAvatar";
