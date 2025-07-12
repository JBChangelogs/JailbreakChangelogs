import type { Viewport, Metadata } from "next";
import { fetchUserByIdForMetadata } from "@/utils/api";
import { getMaintenanceMetadata } from '@/utils/maintenance';

function formatAccentColor(color: number | string | null | undefined): string {
  if (!color || color === "None" || color === "0") return "#124e66";

  if (typeof color === 'string') {
    return `#${color.substring(0, 6)}`;
  }

  if (typeof color === 'number') {
    return `#${color.toString().substring(0, 6)}`;
  }

  return "#124e66";
}

export async function generateViewport({ params }: { params: Promise<{ id: string }> }): Promise<Viewport> {
  const { id } = await params;
  
  try {
    const user = await fetchUserByIdForMetadata(id);
    return {
      themeColor: formatAccentColor(user?.accent_color),
    };
  } catch (error: unknown) {
    // Handle banned user errors gracefully
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.startsWith('BANNED_USER:')) {
      // Return a default theme color for banned users
      return {
        themeColor: "#124e66",
      };
    }
    
    // For other errors, return default theme color
    return {
      themeColor: "#124e66",
    };
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  // Check for maintenance mode first
  const maintenanceMetadata = await getMaintenanceMetadata();
  if (maintenanceMetadata) {
    return maintenanceMetadata;
  }

  const { id } = await params;
  const userId = id;
  
  try {
    const user = await fetchUserByIdForMetadata(userId);
    
    if (!user) {
      return {
        metadataBase: new URL('https://jailbreakchangelogs.xyz'),
        title: "User Not Found | Changelogs",
        description: "This user profile could not be found on Jailbreak Changelogs.",
        alternates: {
          canonical: `/users/${userId}`,
        },
        openGraph: {
          title: "User Not Found | Changelogs",
          description: "This user profile could not be found on Jailbreak Changelogs.",
          type: "website",
          url: `/users/${userId}`,
          siteName: "Jailbreak Changelogs",
        },
        twitter: {
          card: "summary",
          title: "User Not Found | Changelogs",
          description: "This user profile could not be found on Jailbreak Changelogs.",
        },
      };
    }
    
    const displayName = user.global_name && user.global_name !== "None" 
      ? user.global_name 
      : user.username;
    
    const username = user.username;
    
    const titleFormat = username 
      ? `${displayName}'s (@${username}) Profile | Changelogs`
      : `${displayName}'s Profile | Changelogs`;
    
    return {
      metadataBase: new URL('https://jailbreakchangelogs.xyz'),
      title: titleFormat,
      description: `Check out ${displayName}'s profile on Jailbreak Changelogs. View their contributions and stay connected.`,
      alternates: {
        canonical: `/users/${userId}`,
      },
      openGraph: {
        title: titleFormat,
        description: `Check out ${displayName}'s profile on Jailbreak Changelogs. View their contributions and stay connected.`,
        images: [
          {
            url: `/api/og/user?id=${userId}`,
            width: 1200,
            height: 630,
            alt: `${displayName}'s banner`,
          },
        ],
        siteName: username ? `@${username} | Changelogs` : "Jailbreak Changelogs Users",
        url: `/users/${userId}`,
      },
      twitter: {
        card: "summary_large_image",
        title: titleFormat,
        description: `Check out ${displayName}'s profile on Jailbreak Changelogs. View their contributions and stay connected.`,
        images: [`/api/og/user?id=${userId}`],
      },
    };
  } catch (error: unknown) {
    // Check if this is a banned user error
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.startsWith('BANNED_USER:')) {
      const bannedMessage = error.message.replace('BANNED_USER:', '').trim();
      return {
        metadataBase: new URL('https://jailbreakchangelogs.xyz'),
        title: "User Banned | Changelogs",
        description: bannedMessage,
        alternates: {
          canonical: `/users/${userId}`,
        },
        openGraph: {
          title: "User Banned | Changelogs",
          description: bannedMessage,
          type: "website",
          url: `/users/${userId}`,
          siteName: "Jailbreak Changelogs",
        },
        twitter: {
          card: "summary",
          title: "User Banned | Changelogs",
          description: bannedMessage,
        },
      };
    }
    
    // Fallback for other errors
    return {
      metadataBase: new URL('https://jailbreakchangelogs.xyz'),
      title: "User Not Found | Changelogs",
      description: "This user profile could not be found on Jailbreak Changelogs.",
      alternates: {
        canonical: `/users/${userId}`,
      },
      openGraph: {
        title: "User Not Found | Changelogs",
        description: "This user profile could not be found on Jailbreak Changelogs.",
        type: "website",
        url: `/users/${userId}`,
        siteName: "Jailbreak Changelogs",
      },
      twitter: {
        card: "summary",
        title: "User Not Found | Changelogs",
        description: "This user profile could not be found on Jailbreak Changelogs.",
      },
    };
  }
}

export default function UserProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}