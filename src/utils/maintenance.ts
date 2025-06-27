import type { Metadata } from 'next';

export async function checkMaintenanceMode(): Promise<{
  isMaintenanceMode: boolean;
}> {
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

  return {
    isMaintenanceMode,
  };
}

export async function getMaintenanceMetadata(): Promise<Metadata | null> {
  const { isMaintenanceMode } = await checkMaintenanceMode();

  if (isMaintenanceMode) {
    return {
      metadataBase: new URL('https://jailbreakchangelogs.xyz'),
      title: 'Under Maintenance',
      description: "Jailbreak Changelogs is currently under maintenance. We'll be back soon!",
      robots: {
        index: false,
        follow: false,
      },
      openGraph: {
        title: "Under Maintenance",
        description: "Jailbreak Changelogs is currently under maintenance. We'll be back soon!",
        type: "website",
        locale: "en_US",
        siteName: 'Jailbreak Changelogs',
        url: 'https://jailbreakchangelogs.xyz',
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
        description: "Jailbreak Changelogs is currently under maintenance. We'll be back soon!",
        images: [
          "https://assets.jailbreakchangelogs.xyz/assets/backgrounds/background16.webp"
        ],
      },
    };
  }

  return null;
} 