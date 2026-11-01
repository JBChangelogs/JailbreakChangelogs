import { withDiscordEmbed } from "@/lib/discord-embed";
import { Metadata } from "next";

const pageMetadata: Metadata = {
  title: "Robbery LIVE Tracker",
  description:
    "Track live status of robberies and mansions in Roblox Jailbreak. Get real-time updates on what's open across servers.",
  alternates: {
    canonical: "/robberies",
  },
  openGraph: {
    title: "Robbery LIVE Tracker | Jailbreak Changelogs",
    description:
      "Track live status of robberies and mansions in Roblox Jailbreak. See what's open across servers right now.",
    images: [
      {
        url: "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Embed_Graphic.png",
        width: 2400,
        height: 1260,
        alt: "Jailbreak Changelogs Banner",
      },
    ],
    type: "website",
    siteName: "Jailbreak Changelogs",
    url: "https://jailbreakchangelogs.com/robberies",
  },
  twitter: {
    card: "summary_large_image",
    title: "Robbery LIVE Tracker | Jailbreak Changelogs",
    description:
      "Track live status of robberies and mansions in Roblox Jailbreak. See what's open across servers right now.",
    images: [
      "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Embed_Graphic.png",
    ],
  },
};

export const metadata = withDiscordEmbed(pageMetadata, "/robberies");

export default function RobberiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
