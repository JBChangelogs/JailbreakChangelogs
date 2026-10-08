import { withDiscordEmbed } from "@/lib/discord-embed";
import { Metadata } from "next";

const pageMetadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.com"),
  title: "Support Us",
  description:
    "Support Jailbreak Changelogs and unlock exclusive perks. Choose from various supporter tiers to enhance your experience and help us maintain the platform.",
  alternates: {
    canonical: "/supporting",
  },
  openGraph: {
    title: "Support Us",
    description:
      "Support Jailbreak Changelogs and unlock exclusive perks. Choose from various supporter tiers to enhance your experience and help us maintain the platform.",
    type: "website",
    siteName: "Jailbreak Changelogs",
    url: "https://jailbreakchangelogs.com/supporting",
    images: [
      {
        url: "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Support_Us_Embed.png",
        width: 2400,
        height: 1260,
        alt: "Jailbreak Changelogs Support Us Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Support Jailbreak Changelogs",
    description:
      "Support Jailbreak Changelogs and unlock exclusive perks. Choose from various supporter tiers to enhance your experience and help us maintain the platform.",
    images: [
      "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Support_Us_Embed.png",
    ],
  },
};

export const metadata = withDiscordEmbed(pageMetadata, "/supporting");

export default function SupportingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
