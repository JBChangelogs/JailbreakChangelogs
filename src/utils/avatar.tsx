import Image from "next/image";
import { useState } from "react";
import dynamic from "next/dynamic";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });
const CircularProgress = dynamic(
  () => import("@mui/material/CircularProgress"),
  { ssr: false },
);

// Removed dynamic Badge import and styled components to prevent layout shifts
// Now using simple CSS badges for better performance and no hydration issues

interface UserAvatarProps {
  userId: string;
  avatarHash: string | null;
  username: string;
  size?: number;
  accent_color?: string;
  custom_avatar?: string;
  isOnline?: boolean;
  showBadge?: boolean;
  settings?: {
    avatar_discord: number;
    hide_presence?: number;
  };
  shape?: "circle" | "square";
  showBorder?: boolean;
  premiumType?: number;
}

/**
 * Formats a color value to a hex color format by taking first 6 characters
 * @param color - The color value to format
 * @returns A hex color string with a # prefix, or a default color if input is invalid
 */
function formatAccentColor(color: number | string | null | undefined): string {
  // Return default color if color is falsy, "None", or "0"
  if (!color || color === "None" || color === "0") return "#124e66";

  // If it's a string, pad with zeros to 6 chars, then use first 6 chars
  if (typeof color === "string") {
    const padded = (color + "000000").substring(0, 6);
    return `#${padded}`;
  }

  // If it's a number, convert to string, pad with zeros, then use first 6 chars
  if (typeof color === "number") {
    const colorStr = color.toString();
    const padded = (colorStr + "000000").substring(0, 6);
    return `#${padded}`;
  }

  // If all else fails, return the default color
  return "#124e66";
}

export const DefaultAvatar = () => (
  <svg
    className="text-muted h-full w-full"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="12" fill="#2E3944" />
    <path
      d="M12 13.5C14.4853 13.5 16.5 11.4853 16.5 9C16.5 6.51472 14.4853 4.5 12 4.5C9.51472 4.5 7.5 6.51472 7.5 9C7.5 11.4853 9.51472 13.5 12 13.5Z"
      fill="#d3d9d4"
    />
    <path
      d="M12 15C8.13401 15 5 18.134 5 22H19C19 18.134 15.866 15 12 15Z"
      fill="#d3d9d4"
    />
  </svg>
);

const BadgeWrapper = ({
  children,
  isOnline,
  showBadge,
  isHidden = false,
}: {
  children: React.ReactNode;
  isOnline?: boolean;
  showBadge?: boolean;
  isHidden?: boolean;
}) => {
  if (!showBadge) return <>{children}</>;

  // Show placeholder badge immediately to prevent layout shift
  return (
    <div className="relative">
      {children}
      <Tooltip
        title={isHidden ? "Hidden" : isOnline ? "Online" : "Offline"}
        placement="top"
        arrow
        slotProps={{
          tooltip: {
            sx: {
              backgroundColor: "#0F1419",
              color: "#D3D9D4",
              fontSize: "0.75rem",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #2E3944",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              "& .MuiTooltip-arrow": {
                color: "#0F1419",
              },
            },
          },
        }}
      >
        <div
          className={`absolute right-0 bottom-0 h-4 w-4 translate-x-1 translate-y-1 transform cursor-help rounded-full border-2 border-[#212A31] ${
            isOnline ? "bg-[#44b700]" : "bg-[#bdbdbd]"
          }`}
        />
      </Tooltip>
    </div>
  );
};

export const UserAvatar = ({
  userId,
  avatarHash,
  username,
  size = 12,
  accent_color,
  custom_avatar,
  isOnline,
  showBadge = true,
  settings,
  shape = "circle",
  showBorder = true,
  premiumType,
}: UserAvatarProps) => {
  const [imageError, setImageError] = useState(false);
  const [customAvatarError, setCustomAvatarError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate the border style based on accent color and showBorder prop
  const formattedAccentColor = formatAccentColor(accent_color);
  const borderStyle = showBorder
    ? { border: `3px solid ${formattedAccentColor}` }
    : {};

  // Determine the final shape: if premiumType is 3, use square, otherwise use the shape prop
  const finalShape = premiumType === 3 ? "square" : shape;

  const getAvatarSource = () => {
    // If user wants to use Discord avatar and we haven't had an error yet
    if (settings?.avatar_discord === 1 && !imageError) {
      // Only show Discord avatar if it exists and is not "None"
      if (avatarHash && avatarHash !== "None") {
        const url = `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}?size=4096`;
        return {
          src: url,
          alt: username ? `${username}'s profile picture` : "User avatar",
          onError: () => setImageError(true),
        };
      }
    }

    // If user has explicitly chosen to use custom avatar (Discord toggle off)
    if (
      settings?.avatar_discord === 0 &&
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

    // Default fallback to placeholder avatar
    return null;
  };

  const avatarSource = getAvatarSource();

  if (!avatarSource) {
    return (
      <BadgeWrapper
        isOnline={isOnline}
        showBadge={showBadge}
        isHidden={settings?.hide_presence === 1}
      >
        <div
          className={`relative ${finalShape === "circle" ? "rounded-full" : finalShape === "square" && premiumType === 3 ? "rounded-sm" : finalShape === "square" ? "rounded-lg" : "rounded-full"} flex-shrink-0 overflow-hidden`}
          style={{
            ...borderStyle,
            width: size * 4,
            height: size * 4,
            minWidth: size * 4,
            minHeight: size * 4,
          }}
        >
          <div className="flex h-full w-full items-center justify-center bg-[#2E3944]">
            <DefaultAvatar />
          </div>
        </div>
      </BadgeWrapper>
    );
  }

  return (
    <BadgeWrapper
      isOnline={isOnline}
      showBadge={showBadge}
      isHidden={settings?.hide_presence === 1}
    >
      <div
        className={`relative ${finalShape === "circle" ? "rounded-full" : finalShape === "square" && premiumType === 3 ? "rounded-sm" : finalShape === "square" ? "rounded-lg" : "rounded-full"} flex-shrink-0 overflow-hidden`}
        style={{
          ...borderStyle,
          width: size * 4,
          height: size * 4,
          minWidth: size * 4,
          minHeight: size * 4,
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#2E3944]">
            <CircularProgress size={24} sx={{ color: "#5865F2" }} />
          </div>
        )}
        <div className="absolute inset-0 bg-[#212A31]">
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
    </BadgeWrapper>
  );
};
