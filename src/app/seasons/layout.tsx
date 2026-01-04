import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.xyz"),
  title: "Jailbreak Seasons | Complete Season Archives",
  description:
    "Explore every season of Roblox Jailbreak! Each season brings exciting limited-time rewards, exclusive vehicles, and unique customization items.",
  alternates: {
    canonical: "/seasons",
  },
  openGraph: {
    title: "Jailbreak Seasons | Complete Season Archives",
    description:
      "Explore every season of Roblox Jailbreak! Each season brings exciting limited-time rewards, exclusive vehicles, and unique customization items.",
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
    url: "https://jailbreakchangelogs.xyz/seasons",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jailbreak Seasons | Complete Season Archives",
    description:
      "Explore every season of Roblox Jailbreak! Each season brings exciting limited-time rewards, exclusive vehicles, and unique customization items.",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
    ],
  },
};

export default function SeasonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}
