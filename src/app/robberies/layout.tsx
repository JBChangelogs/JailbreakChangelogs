import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Robbery LIVE Tracker | Jailbreak Changelogs",
  description:
    "Track live status of robberies, mansions, and airdrops in Roblox Jailbreak. Get real-time updates on open stores and upcoming events.",
  alternates: {
    canonical: "/robberies",
  },
  openGraph: {
    title: "Robbery LIVE Tracker | Jailbreak Changelogs",
    description:
      "Track live status of robberies, mansions, and airdrops in Roblox Jailbreak. Get real-time updates on robberies, mansions, and airdrops.",
    images: [
      {
        url: "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Light_Background.png",
        width: 1200,
        height: 630,
        alt: "Jailbreak Changelogs Banner",
      },
    ],
    type: "website",
    siteName: "Jailbreak Changelogs",
    url: "https://jailbreakchangelogs.xyz/robberies",
  },
  twitter: {
    card: "summary_large_image",
    title: "Robbery LIVE Tracker | Jailbreak Changelogs",
    description:
      "Track live status of robberies, mansions, and airdrops in Roblox Jailbreak. Get real-time updates on robberies, mansions, and airdrops.",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Light_Background.png",
    ],
  },
};

export default function RobberiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
