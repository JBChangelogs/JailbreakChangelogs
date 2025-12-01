import type { Metadata } from "next";
import { getNetworthLeaderboardMaintenanceMetadata } from "@/utils/maintenance";

export async function generateMetadata(): Promise<Metadata> {
  const maintenanceMetadata = await getNetworthLeaderboardMaintenanceMetadata();
  if (maintenanceMetadata) {
    return maintenanceMetadata;
  }

  return {
    metadataBase: new URL("https://jailbreakchangelogs.xyz"),
    title: "Networth Leaderboard - Jailbreak Changelogs",
    description:
      "View the top players in Roblox Jailbreak ranked by their total inventory networth. See who has the most valuable inventory, find your rank, and track the wealthiest players in the game.",
    alternates: {
      canonical: "/inventories/networth",
    },
    openGraph: {
      title: "Networth Leaderboard - Jailbreak Changelogs",
      description:
        "View the top players in Roblox Jailbreak ranked by their total inventory networth. See who has the most valuable inventory, find your rank, and track the wealthiest players in the game.",
      type: "website",
      siteName: "Jailbreak Changelogs",
      url: "https://jailbreakchangelogs.xyz/inventories/networth",
    },
    twitter: {
      card: "summary_large_image",
      title: "Networth Leaderboard - Jailbreak Changelogs",
      description:
        "View the top players in Roblox Jailbreak ranked by their total inventory networth. See who has the most valuable inventory, find your rank, and track the wealthiest players in the game.",
    },
    keywords: [
      "jailbreak",
      "roblox",
      "networth leaderboard",
      "inventory value",
      "jailbreak networth",
      "top players",
      "leaderboard",
      "jailbreak changelogs",
      "inventory",
    ],
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default function NetworthLeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
