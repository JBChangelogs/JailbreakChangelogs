import type { Metadata } from "next";

export const metadata: Metadata = {
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
    images: [
      {
        url: "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Light_Background.png",
        width: 1200,
        height: 630,
        alt: "Jailbreak Changelogs Networth Leaderboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Networth Leaderboard - Jailbreak Changelogs",
    description:
      "View the top players in Roblox Jailbreak ranked by their total inventory networth. See who has the most valuable inventory, find your rank, and track the wealthiest players in the game.",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Light_Background.png",
    ],
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

export default function NetworthLeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
