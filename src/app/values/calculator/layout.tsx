import { withDiscordEmbed } from "@/lib/discord-embed";
import { Metadata } from "next";

const pageMetadata: Metadata = {
  title: "Value Calculator",
  description: "Calculate the value of your Roblox Jailbreak items and trades",
  metadataBase: new URL("https://jailbreakchangelogs.com"),
  openGraph: {
    title: "Value Calculator",
    description:
      "Calculate the value of your Roblox Jailbreak items and trades",
    images: [
      {
        url: "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_X_TC_Embed_Graphic.png",
        width: 2400,
        height: 1260,
        alt: "Jailbreak Changelogs Banner",
      },
    ],
    type: "website",
    siteName: "Jailbreak Changelogs",
    url: "https://jailbreakchangelogs.com/values/calculator",
  },
  twitter: {
    card: "summary_large_image",
    title: "Value Calculator",
    description:
      "Calculate the value of your Roblox Jailbreak items and trades",
    images: [
      "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_X_TC_Embed_Graphic.png",
    ],
  },
};

export const metadata = withDiscordEmbed(pageMetadata, "/values/calculator");

export default function CalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
