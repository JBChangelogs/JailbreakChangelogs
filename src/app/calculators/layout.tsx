import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.xyz"),
  title: "Jailbreak Calculators | JailbreakChangelogs",
  description:
    "Access our calculators in one place - Values Calculator, Season XP Calculator, Dupe Calculator, and Hyperchrome Pity Calculator.",
  alternates: {
    canonical: "/calculators",
  },
  openGraph: {
    title: "Jailbreak Calculators | JailbreakChangelogs",
    description:
      "Access our calculators in one place - Values Calculator, Season XP Calculator, Dupe Calculator, and Hyperchrome Pity Calculator.",
    type: "website",
    siteName: "Jailbreak Changelogs",
    url: "https://jailbreakchangelogs.xyz/calculators",
    images: [
      {
        url: "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Light_Background.png",
        width: 1200,
        height: 630,
        alt: "Jailbreak Calculators",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jailbreak Calculators | JailbreakChangelogs",
    description:
      "Access our calculators in one place - Values Calculator, Season XP Calculator, Dupe Calculator, and Hyperchrome Pity Calculator.",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Light_Background.png",
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
