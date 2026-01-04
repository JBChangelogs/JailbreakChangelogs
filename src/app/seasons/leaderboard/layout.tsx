import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL("https://jailbreakchangelogs.xyz"),
    title: "Season Leaderboard - Jailbreak Changelogs",
    description:
      "View the top 25 players in the current Roblox Jailbreak season ranked by their total experience and see who's leading the season",
    alternates: {
      canonical: "/seasons/leaderboard",
    },
    openGraph: {
      title: "Season Leaderboard - Jailbreak Changelogs",
      description:
        "View the top 25 players in the current Roblox Jailbreak season ranked by their total experience and see who's leading the seaso",
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
      url: "https://jailbreakchangelogs.xyz/seasons/leaderboard",
    },
    twitter: {
      card: "summary_large_image",
      title: "Season Leaderboard - Jailbreak Changelogs",
      description:
        "View the top 25 players in the current Roblox Jailbreak season ranked by their total experience and see who's leading the seaso",
      images: [
        "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
      ],
    },
    keywords: [
      "jailbreak",
      "roblox",
      "season leaderboard",
      "jailbreak season",
      "top players",
      "season xp",
      "experience leaderboard",
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
}

export default function SeasonLeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
