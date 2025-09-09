import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.xyz"),
  title: "Dupe Calculator",
  description:
    "Check for duplicated items in your inventory using our dupe calculator tool.",
  alternates: {
    canonical: "/dupes/calculator",
  },
  openGraph: {
    title: "Dupe Calculator",
    description:
      "Check for duplicated items in your inventory using our dupe calculator tool.",
    type: "website",
    url: "https://jailbreakchangelogs.xyz/dupes/calculator",
    siteName: "Jailbreak Changelogs",
    images: [
      {
        url: "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp",
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
      "Check for duplicated items in your inventory using our dupe calculator tool.",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp",
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
