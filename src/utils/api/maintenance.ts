import type { Metadata } from "next";
import { getBooleanFlag } from "@/utils/api/runtimeFlags";

// Maintenance switches are runtime flags evaluated per-request, so they can
// be flipped from the Railway dashboard/CLI without a redeploy.

export async function checkMaintenanceMode(): Promise<{
  isMaintenanceMode: boolean;
}> {
  // Testing deployments use tester-role proxy gating instead of maintenance UI.
  if (process.env.RAILWAY_ENVIRONMENT_NAME === "testing") {
    return { isMaintenanceMode: false };
  }

  return {
    isMaintenanceMode: getBooleanFlag("maintenance-mode"),
  };
}

export async function getMaintenanceMetadata(): Promise<Metadata | null> {
  const { isMaintenanceMode } = await checkMaintenanceMode();

  if (isMaintenanceMode) {
    // For server-side rendering, we can't check localStorage
    // So we'll return maintenance metadata and let the client-side component handle the bypass
    return {
      metadataBase: new URL("https://jailbreakchangelogs.com"),
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
        url: "https://jailbreakchangelogs.com",
        images: [
          {
            url: "https://assets.jailbreakchangelogs.com/assets/backgrounds/background16.webp",
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
          "https://assets.jailbreakchangelogs.com/assets/backgrounds/background16.webp",
        ],
      },
    };
  }

  return null;
}

export async function checkInventoryMaintenanceMode(): Promise<{
  isInventoryMaintenanceMode: boolean;
}> {
  return {
    isInventoryMaintenanceMode: getBooleanFlag("inventory-maintenance-mode"),
  };
}

export async function getInventoryMaintenanceMetadata(): Promise<Metadata | null> {
  const { isInventoryMaintenanceMode } = await checkInventoryMaintenanceMode();

  if (isInventoryMaintenanceMode) {
    return {
      metadataBase: new URL("https://jailbreakchangelogs.com"),
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
        url: "https://jailbreakchangelogs.com/inventories",
        images: [
          {
            url: "https://assets.jailbreakchangelogs.com/assets/backgrounds/background16.webp",
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
          "https://assets.jailbreakchangelogs.com/assets/backgrounds/background16.webp",
        ],
      },
    };
  }

  return null;
}

export async function checkOGFinderMaintenanceMode(): Promise<{
  isOGFinderMaintenanceMode: boolean;
}> {
  return {
    isOGFinderMaintenanceMode: getBooleanFlag("og-finder-maintenance-mode"),
  };
}

export async function getOGFinderMaintenanceMetadata(): Promise<Metadata | null> {
  const { isOGFinderMaintenanceMode } = await checkOGFinderMaintenanceMode();

  if (isOGFinderMaintenanceMode) {
    return {
      metadataBase: new URL("https://jailbreakchangelogs.com"),
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
        url: "https://jailbreakchangelogs.com/og",
        images: [
          {
            url: "https://assets.jailbreakchangelogs.com/assets/backgrounds/background16.webp",
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
          "https://assets.jailbreakchangelogs.com/assets/backgrounds/background16.webp",
        ],
      },
    };
  }

  return null;
}

export async function checkDupeFinderMaintenanceMode(): Promise<{
  isDupeFinderMaintenanceMode: boolean;
}> {
  return {
    isDupeFinderMaintenanceMode: getBooleanFlag("dupe-finder-maintenance-mode"),
  };
}

export async function getDupeFinderMaintenanceMetadata(): Promise<Metadata | null> {
  const { isDupeFinderMaintenanceMode } =
    await checkDupeFinderMaintenanceMode();

  if (isDupeFinderMaintenanceMode) {
    return {
      metadataBase: new URL("https://jailbreakchangelogs.com"),
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
        url: "https://jailbreakchangelogs.com/dupes",
        images: [
          {
            url: "https://assets.jailbreakchangelogs.com/assets/backgrounds/background16.webp",
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
          "https://assets.jailbreakchangelogs.com/assets/backgrounds/background16.webp",
        ],
      },
    };
  }

  return null;
}

export async function checkMoneyLeaderboardMaintenanceMode(): Promise<{
  isMoneyLeaderboardMaintenanceMode: boolean;
}> {
  return {
    isMoneyLeaderboardMaintenanceMode: getBooleanFlag(
      "money-leaderboard-maintenance-mode",
    ),
  };
}

export async function getMoneyLeaderboardMaintenanceMetadata(): Promise<Metadata | null> {
  const { isMoneyLeaderboardMaintenanceMode } =
    await checkMoneyLeaderboardMaintenanceMode();

  if (isMoneyLeaderboardMaintenanceMode) {
    return {
      metadataBase: new URL("https://jailbreakchangelogs.com"),
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
        url: "https://jailbreakchangelogs.com/leaderboard/money",
        images: [
          {
            url: "https://assets.jailbreakchangelogs.com/assets/backgrounds/background16.webp",
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
          "https://assets.jailbreakchangelogs.com/assets/backgrounds/background16.webp",
        ],
      },
    };
  }

  return null;
}
