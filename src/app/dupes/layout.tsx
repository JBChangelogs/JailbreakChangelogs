import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.xyz"),
  title: "Dupe Finder - Jailbreak Changelogs",
  description:
    "Find and check for duplicated items in Roblox Jailbreak inventories. Use our dupe finder tool to identify potential duplicate items in your or other players' inventories.",
  alternates: {
    canonical: "/dupes",
  },
  openGraph: {
    title: "Dupe Finder - Jailbreak Changelogs",
    description:
      "Find and check for duplicated items in Roblox Jailbreak inventories. Use our dupe finder tool to identify potential duplicate items in your or other players' inventories.",
    type: "website",
    siteName: "Jailbreak Changelogs",
    url: "https://jailbreakchangelogs.xyz/dupes",
    images: [
      {
        url: "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp",
        width: 1200,
        height: 630,
        alt: "Jailbreak Changelogs Dupe Finder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dupe Finder - Jailbreak Changelogs",
    description:
      "Find and check for duplicated items in Roblox Jailbreak inventories. Use our dupe finder tool to identify potential duplicate items in your or other players' inventories.",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp",
    ],
  },
};

export default function DupesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="w-full">{children}</div>;
}
