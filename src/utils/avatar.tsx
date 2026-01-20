"use client";

import Image from "next/image";
import { useState } from "react";
import dynamic from "next/dynamic";

const CircularProgress = dynamic(
  () => import("@mui/material/CircularProgress"),
  { ssr: false },
);

interface UserAvatarProps {
  userId: string;
  avatarHash: string | null;
  username: string;
  size?: number;
  custom_avatar?: string;
  isOnline?: boolean;
  showBadge?: boolean;
  settings?: {
    avatar_discord: number;
    hide_presence?: number;
  };
  shape?: "circle" | "square";
  premiumType?: number;
}

export const DefaultAvatar = ({
  premiumType,
  shape = "circle",
}: {
  premiumType?: number;
  shape?: "circle" | "square";
} = {}) => {
  const finalShape = premiumType === 3 ? "square" : shape;

  return (
    <svg
      className="text-tertiary-text h-full w-full"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {finalShape === "square" ? (
        <rect x="0" y="0" width="24" height="24" fill="currentColor" />
      ) : (
        <circle cx="12" cy="12" r="12" fill="currentColor" />
      )}
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
};

const AvatarWrapper = ({
  children,
  isOnline,
  showBadge,
  isHidden = false,
  shape = "circle",
  premiumType,
}: {
  children: React.ReactNode;
  isOnline?: boolean;
  showBadge?: boolean;
  isHidden?: boolean;
  shape?: "circle" | "square";
  premiumType?: number;
}) => {
  if (!showBadge) return <>{children}</>;

  const finalShape = premiumType === 3 ? "square" : shape;
  const ringClass = isOnline && !isHidden ? "ring-4" : "";
  const ringStyle =
    isOnline && !isHidden
      ? ({
          "--tw-ring-color": "var(--color-status-success-vibrant)",
        } as React.CSSProperties)
      : {};

  const roundedClass =
    finalShape === "circle"
      ? "rounded-full"
      : finalShape === "square" && premiumType === 3
        ? "rounded-sm"
        : finalShape === "square"
          ? "rounded-lg"
          : "rounded-full";

  return (
    <div
      className={`${ringClass} ${roundedClass} relative z-20`}
      style={ringStyle}
    >
      {children}
    </div>
  );
};

export const UserAvatar = ({
  userId,
  avatarHash,
  username,
  size = 12,
  custom_avatar,
  isOnline,
  showBadge = true,
  settings,
  shape = "circle",
  premiumType,
}: UserAvatarProps) => {
  const [imageError, setImageError] = useState(false);
  const [customAvatarError, setCustomAvatarError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const finalShape = premiumType === 3 ? "square" : shape;

  const getAvatarSource = () => {
    if (settings?.avatar_discord === 1 && !imageError) {
      if (avatarHash && avatarHash !== "None") {
        const url = `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}?size=4096`;
        return {
          src: url,
          alt: username ? `${username}'s profile picture` : "User avatar",
          onError: () => setImageError(true),
        };
      }
    }

    if (
      settings?.avatar_discord === 0 &&
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

    if (
      settings?.avatar_discord === 0 &&
      (!premiumType || premiumType < 2) &&
      !imageError
    ) {
      if (avatarHash && avatarHash !== "None") {
        const url = `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}?size=4096`;
        return {
          src: url,
          alt: username ? `${username}'s profile picture` : "User avatar",
          onError: () => setImageError(true),
        };
      }
    }

    return null;
  };

  const avatarSource = getAvatarSource();

  if (!avatarSource) {
    return (
      <AvatarWrapper
        isOnline={isOnline}
        showBadge={showBadge}
        isHidden={settings?.hide_presence === 1}
        shape={shape}
        premiumType={premiumType}
      >
        <div
          className={`relative ${finalShape === "circle" ? "rounded-full" : finalShape === "square" && premiumType === 3 ? "rounded-sm" : finalShape === "square" ? "rounded-lg" : "rounded-full"} bg-primary-bg shrink-0 overflow-hidden`}
          style={{
            width: size * 4,
            height: size * 4,
            minWidth: size * 4,
            minHeight: size * 4,
          }}
        >
          <div className="flex h-full w-full items-center justify-center">
            <DefaultAvatar premiumType={premiumType} shape={shape} />
          </div>
        </div>
      </AvatarWrapper>
    );
  }

  return (
    <AvatarWrapper
      isOnline={isOnline}
      showBadge={showBadge}
      isHidden={settings?.hide_presence === 1}
      shape={shape}
      premiumType={premiumType}
    >
      <div
        className={`relative ${finalShape === "circle" ? "rounded-full" : finalShape === "square" && premiumType === 3 ? "rounded-sm" : finalShape === "square" ? "rounded-lg" : "rounded-full"} bg-primary-bg shrink-0 overflow-hidden`}
        style={{
          width: size * 4,
          height: size * 4,
          minWidth: size * 4,
          minHeight: size * 4,
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <CircularProgress size={24} sx={{ color: "#5865F2" }} />
          </div>
        )}
        <div className="absolute inset-0">
          <Image
            src={avatarSource.src}
            alt={avatarSource.alt}
            fill
            priority
            draggable={false}
            onError={avatarSource.onError}
            onLoad={() => {
              setIsLoading(false);
            }}
            className="object-cover"
          />
        </div>
      </div>
    </AvatarWrapper>
  );
};
