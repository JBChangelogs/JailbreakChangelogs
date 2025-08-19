import Image from 'next/image';
import { useState } from 'react';
import { styled } from '@mui/material/styles';
import Badge from '@mui/material/Badge';
import { CircularProgress } from '@mui/material';

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

const OfflineBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#bdbdbd',
    color: '#bdbdbd',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
  },
}));

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
  };
  shape?: 'circle' | 'square';
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
  if (typeof color === 'string') {
    const padded = (color + '000000').substring(0, 6);
    return `#${padded}`;
  }

  // If it's a number, convert to string, pad with zeros, then use first 6 chars
  if (typeof color === 'number') {
    const colorStr = color.toString();
    const padded = (colorStr + '000000').substring(0, 6);
    return `#${padded}`;
  }

  // If all else fails, return the default color
  return "#124e66";
}

export const DefaultAvatar = () => (
  <svg
    className="w-full h-full text-muted"
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

const BadgeWrapper = ({ children, isOnline, showBadge, shape = 'circle' }: { children: React.ReactNode; isOnline?: boolean; showBadge?: boolean; shape?: 'circle' | 'square' }) => {
  if (!showBadge) return <>{children}</>;
  
  const badgeProps = {
    overlap: shape === 'circle' ? "circular" as const : "rectangular" as const,
    anchorOrigin: shape === 'circle' 
      ? { vertical: 'bottom' as const, horizontal: 'right' as const }
      : { vertical: 'bottom' as const, horizontal: 'right' as const },
    variant: "dot" as const
  };
  
  return isOnline ? (
    <StyledBadge {...badgeProps}>
      {children}
    </StyledBadge>
  ) : (
    <OfflineBadge {...badgeProps}>
      {children}
    </OfflineBadge>
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
  shape = 'circle',
  showBorder = true,
  premiumType
}: UserAvatarProps) => {
  const [imageError, setImageError] = useState(false);
  const [customAvatarError, setCustomAvatarError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate the border style based on accent color and showBorder prop
  const formattedAccentColor = formatAccentColor(accent_color);
  const borderStyle = showBorder ? { border: `3px solid ${formattedAccentColor}` } : {};

  // Determine the final shape: if premiumType is 3, use square, otherwise use the shape prop
  const finalShape = premiumType === 3 ? 'square' : shape;

  const getAvatarSource = () => {
    // If user wants to use Discord avatar and we haven't had an error yet
    if (settings?.avatar_discord === 1 && !imageError) {
      // Only show Discord avatar if it exists and is not "None"
      if (avatarHash && avatarHash !== "None") {
        const url = `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}?size=4096`;
        return {
          src: url,
          alt: username ? `${username}'s profile picture` : 'User avatar',
          onError: () => setImageError(true)
        };
      }
    }

    // If user has explicitly chosen to use custom avatar (Discord toggle off)
    if (settings?.avatar_discord === 0 && custom_avatar && custom_avatar !== "N/A" && !customAvatarError) {
      return {
        src: custom_avatar,
        alt: username ? `${username}'s profile picture` : 'User avatar',
        onError: () => setCustomAvatarError(true)
      };
    }

    // Default fallback to placeholder avatar
    return null;
  };

  const avatarSource = getAvatarSource();

  if (!avatarSource) {
    return (
      <BadgeWrapper isOnline={isOnline} showBadge={showBadge} shape={finalShape}>
        <div 
          className={`relative ${finalShape === 'circle' ? 'rounded-full' : finalShape === 'square' && premiumType === 3 ? 'rounded-sm' : finalShape === 'square' ? 'rounded-lg' : 'rounded-full'} overflow-hidden flex-shrink-0`}
          style={{
            ...borderStyle,
            width: size * 4,
            height: size * 4,
            minWidth: size * 4,
            minHeight: size * 4,
          }}
        >
          <div className="w-full h-full bg-[#2E3944] flex items-center justify-center">
            <DefaultAvatar />
          </div>
        </div>
      </BadgeWrapper>
    );
  }

  return (
    <BadgeWrapper isOnline={isOnline} showBadge={showBadge} shape={finalShape}>
      <div 
        className={`relative ${finalShape === 'circle' ? 'rounded-full' : finalShape === 'square' && premiumType === 3 ? 'rounded-sm' : finalShape === 'square' ? 'rounded-lg' : 'rounded-full'} overflow-hidden flex-shrink-0`}
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
            <CircularProgress size={24} sx={{ color: '#5865F2' }} />
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