import { withDiscordEmbed } from "@/lib/discord-embed";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const metadata: Metadata = {
    metadataBase: new URL("https://jailbreakchangelogs.com"),
    title: "Season Leaderboard Unavailable",
    description:
      "Jailbreak seasons are paused until further notice. Live season rankings are unavailable. Browse past seasons and their rewards.",
    alternates: {
      canonical: "/seasons/leaderboard",
    },
    openGraph: {
      title: "Season Leaderboard Unavailable - Jailbreak Changelogs",
      description:
        "Jailbreak seasons are paused until further notice. Live season rankings are unavailable. Browse past seasons and their rewards.",
      images: [
        {
          url: "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Halloween_Banner.png",
          width: 2400,
          height: 1260,
          alt: "Jailbreak Changelogs Banner",
        },
      ],
      type: "website",
      siteName: "Jailbreak Changelogs",
      url: "https://jailbreakchangelogs.com/seasons/leaderboard",
    },
    twitter: {
      card: "summary_large_image",
      title: "Season Leaderboard Unavailable - Jailbreak Changelogs",
      description:
        "Jailbreak seasons are paused until further notice. Live season rankings are unavailable. Browse past seasons and their rewards.",
      images: [
        "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Halloween_Banner.png",
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
  };
  return withDiscordEmbed(metadata, `/seasons/leaderboard`);
}

export default function SeasonLeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
