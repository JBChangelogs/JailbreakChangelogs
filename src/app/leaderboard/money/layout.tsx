import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#124e66",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.xyz"),
  title: "Money Leaderboard - Jailbreak Changelogs",
  description:
    "View the top players in Roblox Jailbreak ranked by their total money. See who has the most cash, find your rank, and track the wealthiest players in the game.",
  alternates: {
    canonical: "/leaderboard/money",
  },
  openGraph: {
    title: "Money Leaderboard - Jailbreak Changelogs",
    description:
      "View the top players in Roblox Jailbreak ranked by their total money. See who has the most cash, find your rank, and track the wealthiest players in the game.",
    type: "website",
    siteName: "Jailbreak Changelogs",
    url: "https://jailbreakchangelogs.xyz/leaderboard/money",
    images: [
      {
        url: "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp",
        width: 1200,
        height: 630,
        alt: "Jailbreak Changelogs Money Leaderboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Money Leaderboard - Jailbreak Changelogs",
    description:
      "View the top players in Roblox Jailbreak ranked by their total money. See who has the most cash, find your rank, and track the wealthiest players in the game.",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp",
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

export default function MoneyLeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
