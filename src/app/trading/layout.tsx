import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Trade Ad | Jailbreak Changelogs",
  description:
    "Browse and create trade offers. Find the best deals and connect with other traders.",
  openGraph: {
    title: "Create Trade Ad | Jailbreak Changelogs",
    description:
      "Browse and create trade offers. Find the best deals and connect with other traders.",
    type: "website",
    images: [
      {
        url: "https://assets.jailbreakchangelogs.xyz/assets/logos/collab/JBCL_X_TC_Logo_Long_Light_Background.png",
        width: 1200,
        height: 630,
        alt: "Trading Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Create Trade Ad | Jailbreak Changelogs",
    description:
      "Browse and create trade offers. Find the best deals and connect with other traders.",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/collab/JBCL_X_TC_Logo_Long_Light_Background.png",
    ],
  },
};

export default function TradingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
