import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.xyz"),
  title: "Calculators",
  description:
    "Access our calculators in one place - Values Calculator, Season XP Calculator, Dupe Calculator, and Hyperchrome Pity Calculator.",
  alternates: {
    canonical: "/calculators",
  },
  openGraph: {
    title: "Jailbreak Calculators | JailbreakChangelogs",
    description:
      "Access our calculators in one place - Values Calculator, Season XP Calculator, Dupe Calculator, and Hyperchrome Pity Calculator.",
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
    url: "https://jailbreakchangelogs.xyz/calculators",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jailbreak Calculators | JailbreakChangelogs",
    description:
      "Access our calculators in one place - Values Calculator, Season XP Calculator, Dupe Calculator, and Hyperchrome Pity Calculator.",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
    ],
  },
};

export default function CalculatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
