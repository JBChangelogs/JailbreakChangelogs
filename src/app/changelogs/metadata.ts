import { Metadata } from "next";

export const defaultMetadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.xyz"),
  title: "Jailbreak Changelogs & Update History",
  description:
    "Track every update, feature release, and game modification in Jailbreak's history. Browse through our comprehensive collection of Roblox Jailbreak changelogs.",
  openGraph: {
    title: "Jailbreak Changelogs & Update History",
    description:
      "Track every update, feature release, and game modification in Jailbreak's history. Browse through our comprehensive collection of Roblox Jailbreak changelogs.",
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
    url: "https://jailbreakchangelogs.xyz/changelogs",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jailbreak Changelogs & Update History",
    description:
      "Track every update, feature release, and game modification in Jailbreak's history. Browse through our comprehensive collection of Roblox Jailbreak changelogs.",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
    ],
  },
};
