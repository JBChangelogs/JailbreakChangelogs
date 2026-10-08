import { withDiscordEmbed } from "@/lib/discord-embed";
import { accentColorToHex } from "@/utils/ui/accentColor";
import type { Viewport, Metadata } from "next";
import { fetchUserByIdForMetadata, PUBLIC_API_URL } from "@/utils/api/api";
import { getMaintenanceMetadata } from "@/utils/api/maintenance";

function formatAccentColor(color: number | string | null | undefined): string {
  return accentColorToHex(color) ?? "#2462cd";
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
      themeColor: formatAccentColor(
        user?.custom_accent_color ?? user?.accent_color,
      ),
    };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string" &&
      (error.message.startsWith("PRIVATE_PROFILE:") ||
        error.message.startsWith("BANNED_USER:") ||
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
    return withDiscordEmbed(
      maintenanceMetadata,
      `/users/${encodeURIComponent((await params).id)}`,
    );
  }

  const { id } = await params;
  const userId = id;

  try {
    const user = await fetchUserByIdForMetadata(userId);

    if (!user) {
      const metadata: Metadata = {
        metadataBase: new URL("https://jailbreakchangelogs.com"),
        title: "User Not Found",
        description:
          "This user profile could not be found on Jailbreak Changelogs.",
        alternates: {
          canonical: `/users/${userId}`,
        },
        openGraph: {
          title: "User Not Found",
          description:
            "This user profile could not be found on Jailbreak Changelogs.",
          type: "website",
          url: "https://jailbreakchangelogs.com/users",
          siteName: "Jailbreak Changelogs",
          images: [
            {
              url: "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Embed_Graphic.png",
              width: 2400,
              height: 1260,
              alt: "Jailbreak Changelogs Banner",
            },
          ],
        },
        twitter: {
          card: "summary_large_image",
          title: "User Not Found",
          description:
            "This user profile could not be found on Jailbreak Changelogs.",
          images: [
            "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Embed_Graphic.png",
          ],
        },
      };
      return withDiscordEmbed(
        metadata,
        `/users/${encodeURIComponent((await params).id)}`,
      );
    }

    const displayName =
      user.global_name && user.global_name !== "None"
        ? user.global_name
        : user.username;

    const username = user.username;

    const titleFormat = username
      ? `${displayName}'s (@${username}) Profile`
      : `${displayName}'s Profile`;
    const imageUrl = `${PUBLIC_API_URL}/v2/users/${encodeURIComponent(userId)}/image`;

    const metadata: Metadata = {
      metadataBase: new URL("https://jailbreakchangelogs.com"),
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
            url: imageUrl,
            width: 1920,
            height: 1080,
            type: "image/webp",
            alt: `${displayName}'s profile card`,
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
        images: [imageUrl],
      },
    };
    return withDiscordEmbed(
      metadata,
      `/users/${encodeURIComponent((await params).id)}`,
    );
  } catch (error: unknown) {
    // Check if this is a banned user error
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string" &&
      error.message.startsWith("PRIVATE_PROFILE:")
    ) {
      const privateMessage = error.message
        .replace("PRIVATE_PROFILE:", "")
        .trim();
      const metadata: Metadata = {
        metadataBase: new URL("https://jailbreakchangelogs.com"),
        title: "Private Profile",
        description: privateMessage || "This user's profile is private.",
        alternates: {
          canonical: `/users/${userId}`,
        },
        openGraph: {
          title: "Private Profile",
          description: privateMessage || "This user's profile is private.",
          type: "website",
          url: "https://jailbreakchangelogs.com/users",
          siteName: "Jailbreak Changelogs",
          images: [
            {
              url: "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Embed_Graphic.png",
              width: 2400,
              height: 1260,
              alt: "Jailbreak Changelogs Banner",
            },
          ],
        },
        twitter: {
          card: "summary_large_image",
          title: "Private Profile",
          description: privateMessage || "This user's profile is private.",
          images: [
            "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Embed_Graphic.png",
          ],
        },
      };
      return withDiscordEmbed(
        metadata,
        `/users/${encodeURIComponent((await params).id)}`,
      );
    }

    // Check if this is a banned user error
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string" &&
      error.message.startsWith("BANNED_USER:")
    ) {
      const bannedMessage = error.message.replace("BANNED_USER:", "").trim();
      const metadata: Metadata = {
        metadataBase: new URL("https://jailbreakchangelogs.com"),
        title: "User Banned",
        description: bannedMessage,
        alternates: {
          canonical: `/users/${userId}`,
        },
        openGraph: {
          title: "User Banned",
          description: bannedMessage,
          type: "website",
          url: "https://jailbreakchangelogs.com/users",
          siteName: "Jailbreak Changelogs",
          images: [
            {
              url: "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Embed_Graphic.png",
              width: 2400,
              height: 1260,
              alt: "Jailbreak Changelogs Banner",
            },
          ],
        },
        twitter: {
          card: "summary_large_image",
          title: "User Banned",
          description: bannedMessage,
          images: [
            "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Embed_Graphic.png",
          ],
        },
      };
      return withDiscordEmbed(
        metadata,
        `/users/${encodeURIComponent((await params).id)}`,
      );
    }

    // Fallback for other errors (including NOT_FOUND)
    const metadata: Metadata = {
      metadataBase: new URL("https://jailbreakchangelogs.com"),
      title: "User Not Found",
      description:
        "This user profile could not be found on Jailbreak Changelogs.",
      alternates: {
        canonical: `/users/${userId}`,
      },
      openGraph: {
        title: "User Not Found",
        description:
          "This user profile could not be found on Jailbreak Changelogs.",
        type: "website",
        url: "https://jailbreakchangelogs.com/users",
        siteName: "Jailbreak Changelogs",
        images: [
          {
            url: "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Embed_Graphic.png",
            width: 2400,
            height: 1260,
            alt: "Jailbreak Changelogs Banner",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "User Not Found",
        description:
          "This user profile could not be found on Jailbreak Changelogs.",
        images: [
          "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Embed_Graphic.png",
        ],
      },
    };
    return withDiscordEmbed(
      metadata,
      `/users/${encodeURIComponent((await params).id)}`,
    );
  }
}

export default function UserProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
