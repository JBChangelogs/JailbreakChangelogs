import type { Metadata } from "next";
import { withDiscordEmbed } from "@/lib/discord-embed";

const title = "Theme Marketplace";
const description = "Browse and use custom themes published by the community.";
const image =
  "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Embed_Graphic.png";

const pageMetadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/themes" },
  openGraph: {
    title,
    description,
    url: "https://jailbreakchangelogs.com/themes",
    type: "website",
    locale: "en_US",
    siteName: "Jailbreak Changelogs",
    images: [
      {
        url: image,
        width: 2400,
        height: 1260,
        alt: "Jailbreak Changelogs Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [image],
  },
};

export const metadata = withDiscordEmbed(pageMetadata, "/themes");

export default function ThemesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
