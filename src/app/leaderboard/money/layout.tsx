import type { Metadata } from "next";
import { getMoneyLeaderboardMaintenanceMetadata } from "@/utils/maintenance";

export async function generateMetadata(): Promise<Metadata> {
  const maintenanceMetadata = await getMoneyLeaderboardMaintenanceMetadata();
  if (maintenanceMetadata) {
    return maintenanceMetadata;
  }

  return {
    metadataBase: new URL("https://jailbreakchangelogs.xyz"),
    title: "Money Leaderboard",
    description:
      "View the top players in Roblox Jailbreak ranked by their total money. See who has the most cash, find your rank, and track the wealthiest players in the game.",
    alternates: {
      canonical: "/leaderboard/money",
    },
    openGraph: {
      title: "Money Leaderboard - Jailbreak Changelogs",
      description:
        "View the top players in Roblox Jailbreak ranked by their total money. See who has the most cash, find your rank, and track the wealthiest players in the game.",
      images: [
        {
          url: "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
          width: 2400,
          height: 1260,
          alt: "Jailbreak Changelogs Banner",
        },
      ],
      type: "website",
      siteName: "Jailbreak Changelogs",
      url: "https://jailbreakchangelogs.xyz/leaderboard/money",
    },
    twitter: {
      card: "summary_large_image",
      title: "Money Leaderboard - Jailbreak Changelogs",
      description:
        "View the top players in Roblox Jailbreak ranked by their total money. See who has the most cash, find your rank, and track the wealthiest players in the game.",
      images: [
        "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
      ],
    },
    keywords: [
      "jailbreak",
      "roblox",
      "money leaderboard",
      "richest players",
      "jailbreak money",
      "top players",
      "leaderboard",
      "jailbreak changelogs",
    ],
  };
}

export default function MoneyLeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
