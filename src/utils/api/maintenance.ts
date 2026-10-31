import type { Metadata } from "next";
import { getBooleanFlag } from "@/utils/api/runtimeFlags";
import { isTestingDeploy } from "@/utils/deployment";

const MAINTENANCE_TITLE = "Under Maintenance | Jailbreak Changelogs";

// Maintenance switches are runtime flags evaluated per-request, so they can
// be flipped from the Railway dashboard/CLI without a redeploy.

function getMaintenanceFlag(name: string): boolean {
  if (process.env.NODE_ENV === "development") {
    const override = process.env[name.replaceAll("-", "_").toUpperCase()];
    if (override !== undefined) return override === "true";
  }
  return getBooleanFlag(name);
}

export async function checkMaintenanceMode(): Promise<{
  isMaintenanceMode: boolean;
}> {
  // Testing deployments use tester-role proxy gating instead of maintenance UI.
  if (isTestingDeploy()) {
    return { isMaintenanceMode: false };
  }

  return {
    isMaintenanceMode: getMaintenanceFlag("maintenance-mode"),
  };
}

export async function getMaintenanceMetadata(): Promise<Metadata | null> {
  const { isMaintenanceMode } = await checkMaintenanceMode();

  if (isMaintenanceMode) {
    // For server-side rendering, we can't check localStorage
    // So we'll return maintenance metadata and let the client-side component handle the bypass
    return {
      metadataBase: new URL("https://jailbreakchangelogs.com"),
      title: { absolute: MAINTENANCE_TITLE },
      description:
        "Jailbreak Changelogs is currently under maintenance. We'll be back soon!",
      robots: {
        index: false,
        follow: false,
      },
      openGraph: {
        title: MAINTENANCE_TITLE,
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
        title: MAINTENANCE_TITLE,
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
    isInventoryMaintenanceMode: getMaintenanceFlag(
      "inventory-maintenance-mode",
    ),
  };
}

export async function getInventoryMaintenanceMetadata(): Promise<Metadata | null> {
  const globalMaintenance = await getMaintenanceMetadata();
  if (globalMaintenance) return globalMaintenance;

  const { isInventoryMaintenanceMode } = await checkInventoryMaintenanceMode();

  if (isInventoryMaintenanceMode) {
    return {
      metadataBase: new URL("https://jailbreakchangelogs.com"),
      title: { absolute: MAINTENANCE_TITLE },
      description:
        "The Inventory API is currently under maintenance. We'll be back soon!",
      robots: {
        index: false,
        follow: false,
      },
      openGraph: {
        title: MAINTENANCE_TITLE,
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
        title: MAINTENANCE_TITLE,
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
    isOGFinderMaintenanceMode: getMaintenanceFlag("og-finder-maintenance-mode"),
  };
}

export async function getOGFinderMaintenanceMetadata(): Promise<Metadata | null> {
  const globalMaintenance = await getMaintenanceMetadata();
  if (globalMaintenance) return globalMaintenance;

  const { isOGFinderMaintenanceMode } = await checkOGFinderMaintenanceMode();

  if (isOGFinderMaintenanceMode) {
    return {
      metadataBase: new URL("https://jailbreakchangelogs.com"),
      title: { absolute: MAINTENANCE_TITLE },
      description:
        "The OG Finder is currently under maintenance. We'll be back soon!",
      robots: {
        index: false,
        follow: false,
      },
      openGraph: {
        title: MAINTENANCE_TITLE,
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
        title: MAINTENANCE_TITLE,
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
    isDupeFinderMaintenanceMode: getMaintenanceFlag(
      "dupe-finder-maintenance-mode",
    ),
  };
}

export async function getDupeFinderMaintenanceMetadata(): Promise<Metadata | null> {
  const globalMaintenance = await getMaintenanceMetadata();
  if (globalMaintenance) return globalMaintenance;

  const { isDupeFinderMaintenanceMode } =
    await checkDupeFinderMaintenanceMode();

  if (isDupeFinderMaintenanceMode) {
    return {
      metadataBase: new URL("https://jailbreakchangelogs.com"),
      title: { absolute: MAINTENANCE_TITLE },
      description:
        "The Dupe Finder is currently under maintenance. We'll be back soon!",
      robots: {
        index: false,
        follow: false,
      },
      openGraph: {
        title: MAINTENANCE_TITLE,
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
        title: MAINTENANCE_TITLE,
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
