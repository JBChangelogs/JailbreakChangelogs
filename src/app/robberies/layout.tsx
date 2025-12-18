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
      "Track live status of robberies, mansions, and airdrops in Roblox Jailbreak. Get real-time updates on open stores and upcoming events.",
    type: "website",
    siteName: "Jailbreak Changelogs",
    url: "https://jailbreakchangelogs.xyz/robberies",
  },
  twitter: {
    card: "summary_large_image",
    title: "Robbery LIVE Tracker | Jailbreak Changelogs",
    description:
      "Track live status of robberies, mansions, and airdrops in Roblox Jailbreak. Get real-time updates on open stores and upcoming events.",
  },
};

export default function RobberiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
