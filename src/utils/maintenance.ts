import type { Metadata } from "next";
import type { UserData, UserFlag } from "@/types/auth";
import { safeGetJSON } from "@/utils/safeStorage";

export async function checkMaintenanceMode(): Promise<{
  isMaintenanceMode: boolean;
}> {
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

  return {
    isMaintenanceMode,
  };
}

export function canBypassMaintenance(): boolean {
  // This function runs on the client side to check if user can bypass maintenance
  if (typeof window === "undefined") return false;

  try {
    const userData = safeGetJSON<UserData>("user", null);
    if (!userData) return false;
    const flags = userData.flags || [];

    // Check if user has tester flag enabled
    const testerFlag = flags.find(
      (flag: UserFlag) => flag.flag === "is_tester" && flag.enabled === true,
    );

    return !!testerFlag;
  } catch (error) {
    console.error("Error checking maintenance bypass:", error);
    return false;
  }
}

export async function getMaintenanceMetadata(): Promise<Metadata | null> {
  const { isMaintenanceMode } = await checkMaintenanceMode();

  if (isMaintenanceMode) {
    // For server-side rendering, we can't check localStorage
    // So we'll return maintenance metadata and let the client-side component handle the bypass
    return {
      metadataBase: new URL("https://jailbreakchangelogs.xyz"),
      title: "Under Maintenance",
      description:
        "Jailbreak Changelogs is currently under maintenance. We'll be back soon!",
      robots: {
        index: false,
        follow: false,
      },
      openGraph: {
        title: "Under Maintenance",
        description:
          "Jailbreak Changelogs is currently under maintenance. We'll be back soon!",
        type: "website",
        locale: "en_US",
        siteName: "Jailbreak Changelogs",
        url: "https://jailbreakchangelogs.xyz",
        images: [
          {
            url: "https://assets.jailbreakchangelogs.xyz/assets/backgrounds/background16.webp",
            width: 1200,
            height: 630,
            alt: "Jailbreak Changelogs Maintenance Banner",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Under Maintenance",
        description:
          "Jailbreak Changelogs is currently under maintenance. We'll be back soon!",
        images: [
          "https://assets.jailbreakchangelogs.xyz/assets/backgrounds/background16.webp",
        ],
      },
    };
  }

  return null;
}

export async function checkInventoryMaintenanceMode(): Promise<{
  isInventoryMaintenanceMode: boolean;
}> {
  const isInventoryMaintenanceMode =
    process.env.NEXT_PUBLIC_INVENTORY_MAINTENANCE_MODE === "true";

  return {
    isInventoryMaintenanceMode,
  };
}

export async function getInventoryMaintenanceMetadata(): Promise<Metadata | null> {
  const { isInventoryMaintenanceMode } = await checkInventoryMaintenanceMode();

  if (isInventoryMaintenanceMode) {
    return {
      metadataBase: new URL("https://jailbreakchangelogs.xyz"),
      title: "Inventory Checker - Under Maintenance",
      description:
        "The Inventory API is currently under maintenance. We'll be back soon!",
      robots: {
        index: false,
        follow: false,
      },
      openGraph: {
        title: "Inventory Checker - Under Maintenance",
        description:
          "The Inventory API is currently under maintenance. We'll be back soon!",
        type: "website",
        locale: "en_US",
        siteName: "Jailbreak Changelogs",
        url: "https://jailbreakchangelogs.xyz/inventories",
        images: [
          {
            url: "https://assets.jailbreakchangelogs.xyz/assets/backgrounds/background16.webp",
            width: 1200,
            height: 630,
            alt: "Jailbreak Changelogs Inventory Maintenance Banner",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Inventory API - Under Maintenance",
        description:
          "The Inventory API is currently under maintenance. We'll be back soon!",
        images: [
          "https://assets.jailbreakchangelogs.xyz/assets/backgrounds/background16.webp",
        ],
      },
    };
  }

  return null;
}

export async function checkOGFinderMaintenanceMode(): Promise<{
  isOGFinderMaintenanceMode: boolean;
}> {
  const isOGFinderMaintenanceMode =
    process.env.NEXT_PUBLIC_OG_FINDER_MAINTENANCE_MODE === "true";

  return {
    isOGFinderMaintenanceMode,
  };
}

export async function getOGFinderMaintenanceMetadata(): Promise<Metadata | null> {
  const { isOGFinderMaintenanceMode } = await checkOGFinderMaintenanceMode();

  if (isOGFinderMaintenanceMode) {
    return {
      metadataBase: new URL("https://jailbreakchangelogs.xyz"),
      title: "OG Finder - Under Maintenance",
      description:
        "The OG Finder is currently under maintenance. We'll be back soon!",
      robots: {
        index: false,
        follow: false,
      },
      openGraph: {
        title: "OG Finder - Under Maintenance",
        description:
          "The OG Finder is currently under maintenance. We'll be back soon!",
        type: "website",
        locale: "en_US",
        siteName: "Jailbreak Changelogs",
        url: "https://jailbreakchangelogs.xyz/og",
        images: [
          {
            url: "https://assets.jailbreakchangelogs.xyz/assets/backgrounds/background16.webp",
            width: 1200,
            height: 630,
            alt: "Jailbreak Changelogs OG Finder Maintenance Banner",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "OG Finder - Under Maintenance",
        description:
          "The OG Finder is currently under maintenance. We'll be back soon!",
        images: [
          "https://assets.jailbreakchangelogs.xyz/assets/backgrounds/background16.webp",
        ],
      },
    };
  }

  return null;
}

export async function checkDupeFinderMaintenanceMode(): Promise<{
  isDupeFinderMaintenanceMode: boolean;
}> {
  const isDupeFinderMaintenanceMode =
    process.env.NEXT_PUBLIC_DUPE_FINDER_MAINTENANCE_MODE === "true";

  return {
    isDupeFinderMaintenanceMode,
  };
}

export async function getDupeFinderMaintenanceMetadata(): Promise<Metadata | null> {
  const { isDupeFinderMaintenanceMode } =
    await checkDupeFinderMaintenanceMode();

  if (isDupeFinderMaintenanceMode) {
    return {
      metadataBase: new URL("https://jailbreakchangelogs.xyz"),
      title: "Dupe Finder - Under Maintenance",
      description:
        "The Dupe Finder is currently under maintenance. We'll be back soon!",
      robots: {
        index: false,
        follow: false,
      },
      openGraph: {
        title: "Dupe Finder - Under Maintenance",
        description:
          "The Dupe Finder is currently under maintenance. We'll be back soon!",
        type: "website",
        locale: "en_US",
        siteName: "Jailbreak Changelogs",
        url: "https://jailbreakchangelogs.xyz/dupes",
        images: [
          {
            url: "https://assets.jailbreakchangelogs.xyz/assets/backgrounds/background16.webp",
            width: 1200,
            height: 630,
            alt: "Jailbreak Changelogs Dupe Finder Maintenance Banner",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Dupe Finder - Under Maintenance",
        description:
          "The Dupe Finder is currently under maintenance. We'll be back soon!",
        images: [
          "https://assets.jailbreakchangelogs.xyz/assets/backgrounds/background16.webp",
        ],
      },
    };
  }

  return null;
}

export async function checkMoneyLeaderboardMaintenanceMode(): Promise<{
  isMoneyLeaderboardMaintenanceMode: boolean;
}> {
  const isMoneyLeaderboardMaintenanceMode =
    process.env.NEXT_PUBLIC_MONEY_LEADERBOARD_MAINTENANCE_MODE === "true";

  return {
    isMoneyLeaderboardMaintenanceMode,
  };
}

export async function getMoneyLeaderboardMaintenanceMetadata(): Promise<Metadata | null> {
  const { isMoneyLeaderboardMaintenanceMode } =
    await checkMoneyLeaderboardMaintenanceMode();

  if (isMoneyLeaderboardMaintenanceMode) {
    return {
      metadataBase: new URL("https://jailbreakchangelogs.xyz"),
      title: "Money Leaderboard - Under Maintenance",
      description:
        "The Money Leaderboard is currently under maintenance. We'll be back soon!",
      robots: {
        index: false,
        follow: false,
      },
      openGraph: {
        title: "Money Leaderboard - Under Maintenance",
        description:
          "The Money Leaderboard is currently under maintenance. We'll be back soon!",
        type: "website",
        locale: "en_US",
        siteName: "Jailbreak Changelogs",
        url: "https://jailbreakchangelogs.xyz/leaderboard/money",
        images: [
          {
            url: "https://assets.jailbreakchangelogs.xyz/assets/backgrounds/background16.webp",
            width: 1200,
            height: 630,
            alt: "Jailbreak Changelogs Money Leaderboard Maintenance Banner",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Money Leaderboard - Under Maintenance",
        description:
          "The Money Leaderboard is currently under maintenance. We'll be back soon!",
        images: [
          "https://assets.jailbreakchangelogs.xyz/assets/backgrounds/background16.webp",
        ],
      },
    };
  }

  return null;
}
