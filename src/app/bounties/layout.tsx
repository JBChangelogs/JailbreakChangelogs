import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bounty LIVE Tracker",
  description:
    "Track high-bounty players in Roblox Jailbreak. Get real-time updates on players with the highest bounties across servers.",
  alternates: {
    canonical: "/bounties",
  },
  openGraph: {
    title: "Bounty LIVE Tracker | Jailbreak Changelogs",
    description:
      "Track high-bounty players in Roblox Jailbreak. Get real-time updates on players with the highest bounties across servers.",
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
    url: "https://jailbreakchangelogs.xyz/bounties",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bounty LIVE Tracker | Jailbreak Changelogs",
    description:
      "Track high-bounty players in Roblox Jailbreak. Get real-time updates on players with the highest bounties across servers.",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
    ],
  },
};

export default function BountiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
