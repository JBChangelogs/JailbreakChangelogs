import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.xyz"),
  title: "Dupe Calculator",
  description:
    "View all items that have been reported as duped in our comprehensive database.",
  alternates: {
    canonical: "/dupes/calculator",
  },
  openGraph: {
    title: "Dupe Calculator",
    description:
      "View all items that have been reported as duped in our comprehensive database.",
    type: "website",
    url: "https://jailbreakchangelogs.xyz/dupes/calculator",
    siteName: "Jailbreak Changelogs",
    images: [
      {
        url: "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Light_Background.png",
        width: 1200,
        height: 630,
        alt: "Dupe Calculator Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dupe Calculator",
    description:
      "View all items that have been reported as duped in our comprehensive database.",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Light_Background.png",
    ],
  },
};

export default function DupeCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
