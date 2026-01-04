import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.xyz"),
  title: "Discord Bot",
  description:
    "Get instant updates about Jailbreak seasons, changelogs, and items directly in your Discord server. Track seasons, view changelogs, and manage trades with our powerful Discord bot.",
  alternates: {
    canonical: "/bot",
  },
  openGraph: {
    title: "Discord Bot",
    description:
      "Get instant updates about Jailbreak seasons, changelogs, and items directly in your Discord server. Track seasons, view changelogs, and manage trades with our powerful Discord bot.",
    url: "https://jailbreakchangelogs.xyz/bot",
    siteName: "Jailbreak Changelogs",
    images: [
      {
        url: "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
        width: 2400,
        height: 1260,
        alt: "Jailbreak Changelogs Banner",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Discord Bot",
    description:
      "Get instant updates about Jailbreak seasons, changelogs, and items directly in your Discord server. Track seasons, view changelogs, and manage trades with our powerful Discord bot.",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
    ],
  },
};

export default function BotLayout({ children }: { children: React.ReactNode }) {
  return children;
}
