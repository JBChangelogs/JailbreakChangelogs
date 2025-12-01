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
  },
  twitter: {
    card: "summary_large_image",
    title: "Dupe Calculator",
    description:
      "View all items that have been reported as duped in our comprehensive database.",
  },
};

export default function DupeCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
