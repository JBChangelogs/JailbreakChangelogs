import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.xyz"),
  title: "Jailbreak Update Timeline | Complete History of Changes",
  description:
    "Explore the complete chronological history of Roblox Jailbreak updates. See how the game has evolved through major updates and feature releases.",
  alternates: {
    canonical: "/changelogs/timeline",
  },
  openGraph: {
    title: "Jailbreak Update Timeline | Complete History of Changes",
    description:
      "Explore the complete chronological history of Roblox Jailbreak updates. See how the game has evolved through major updates and feature releases.",
    siteName: "Jailbreak Changelogs",
    url: "https://jailbreakchangelogs.xyz/changelogs/timeline",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jailbreak Update Timeline | Complete History of Changes",
    description:
      "Explore the complete chronological history of Roblox Jailbreak updates. See how the game has evolved through major updates and feature releases.",
  },
};

export default function TimelineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
