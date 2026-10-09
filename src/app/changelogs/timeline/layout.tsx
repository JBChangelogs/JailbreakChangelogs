import { withDiscordEmbed } from "@/lib/discord-embed";
import { Metadata } from "next";

const pageMetadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.com"),
  title: "Jailbreak Update Timeline | Jailbreak Changelogs",
  description:
    "Explore the complete chronological history of Roblox Jailbreak updates. See how the game has evolved through major updates and feature releases.",
  alternates: {
    canonical: "/changelogs/timeline",
  },
  openGraph: {
    title: "Jailbreak Update Timeline | Complete History of Changes",
    description:
      "Explore the complete chronological history of Roblox Jailbreak updates. See how the game has evolved through major updates and feature releases.",
    images: [
      {
        url: "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Halloween_Banner.png",
        width: 2400,
        height: 1260,
        alt: "Jailbreak Changelogs Banner",
      },
    ],
    siteName: "Jailbreak Changelogs",
    url: "https://jailbreakchangelogs.com/changelogs/timeline",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jailbreak Update Timeline | Complete History of Changes",
    description:
      "Explore the complete chronological history of Roblox Jailbreak updates. See how the game has evolved through major updates and feature releases.",
    images: [
      "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Halloween_Banner.png",
    ],
  },
};

export const metadata = withDiscordEmbed(pageMetadata, "/changelogs/timeline");

export default function TimelineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
