import type { Viewport, Metadata } from "next";
import { fetchUserByIdForMetadata } from "@/utils/api";
import { getMaintenanceMetadata } from "@/utils/maintenance";

function formatAccentColor(color: number | string | null | undefined): string {
  if (!color || color === "None" || color === "0") return "#2462cd";

  if (typeof color === "string") {
    return `#${color.substring(0, 6)}`;
  }

  if (typeof color === "number") {
    return `#${color.toString().substring(0, 6)}`;
  }

  return "#2462cd";
}

export async function generateViewport({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Viewport> {
  const { id } = await params;

  try {
    const user = await fetchUserByIdForMetadata(id);
    return {
      themeColor: formatAccentColor(user?.accent_color),
    };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string" &&
      (error.message.startsWith("BANNED_USER:") ||
        error.message.startsWith("NOT_FOUND:"))
    ) {
      return {};
    }
    return {};
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
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
        metadataBase: new URL("https://jailbreakchangelogs.xyz"),
        title: "User Not Found | Changelogs",
        description:
          "This user profile could not be found on Jailbreak Changelogs.",
        alternates: {
          canonical: `/users/${userId}`,
        },
        openGraph: {
          title: "User Not Found | Changelogs",
          description:
            "This user profile could not be found on Jailbreak Changelogs.",
          type: "website",
          url: "https://jailbreakchangelogs.xyz/users",
          siteName: "Jailbreak Changelogs",
          images: [
            {
              url: "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
              width: 2400,
              height: 1260,
              alt: "Jailbreak Changelogs Banner",
            },
          ],
        },
        twitter: {
          card: "summary_large_image",
          title: "User Not Found | Changelogs",
          description:
            "This user profile could not be found on Jailbreak Changelogs.",
          images: [
            "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
          ],
        },
      };
    }

    const displayName =
      user.global_name && user.global_name !== "None"
        ? user.global_name
        : user.username;

    const username = user.username;

    const titleFormat = username
      ? `${displayName}'s (@${username}) Profile | Changelogs`
      : `${displayName}'s Profile | Changelogs`;

    return {
      metadataBase: new URL("https://jailbreakchangelogs.xyz"),
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
        siteName: username
          ? `@${username} | Changelogs`
          : "Jailbreak Changelogs Users",
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
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string" &&
      error.message.startsWith("BANNED_USER:")
    ) {
      const bannedMessage = error.message.replace("BANNED_USER:", "").trim();
      return {
        metadataBase: new URL("https://jailbreakchangelogs.xyz"),
        title: "User Banned | Changelogs",
        description: bannedMessage,
        alternates: {
          canonical: `/users/${userId}`,
        },
        openGraph: {
          title: "User Banned | Changelogs",
          description: bannedMessage,
          type: "website",
          url: "https://jailbreakchangelogs.xyz/users",
          siteName: "Jailbreak Changelogs",
          images: [
            {
              url: "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
              width: 2400,
              height: 1260,
              alt: "Jailbreak Changelogs Banner",
            },
          ],
        },
        twitter: {
          card: "summary_large_image",
          title: "User Banned | Changelogs",
          description: bannedMessage,
          images: [
            "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
          ],
        },
      };
    }

    // Fallback for other errors (including NOT_FOUND)
    return {
      metadataBase: new URL("https://jailbreakchangelogs.xyz"),
      title: "User Not Found | Changelogs",
      description:
        "This user profile could not be found on Jailbreak Changelogs.",
      alternates: {
        canonical: `/users/${userId}`,
      },
      openGraph: {
        title: "User Not Found | Changelogs",
        description:
          "This user profile could not be found on Jailbreak Changelogs.",
        type: "website",
        url: "https://jailbreakchangelogs.xyz/users",
        siteName: "Jailbreak Changelogs",
        images: [
          {
            url: "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
            width: 2400,
            height: 1260,
            alt: "Jailbreak Changelogs Banner",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "User Not Found | Changelogs",
        description:
          "This user profile could not be found on Jailbreak Changelogs.",
        images: [
          "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
        ],
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
