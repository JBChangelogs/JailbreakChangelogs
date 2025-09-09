import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#124e66",
};

export const metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.xyz"),
  title: "Roblox Jailbreak Values",
  description:
    "View the most accurate and up-to-date values for all tradeable items in Roblox Jailbreak, from limited vehicles to rare cosmetics.",
  alternates: {
    canonical: "/values",
  },
  openGraph: {
    title: "Roblox Jailbreak Values | Changelogs",
    description:
      "View the most accurate and up-to-date values for all tradeable items in Roblox Jailbreak, from limited vehicles to rare cosmetics.",
    images: [
      {
        url: "https://assets.jailbreakchangelogs.xyz/assets/logos/collab/JBCL_X_TC_Logo_Long_Dark_Background.webp",
        width: 1200,
        height: 630,
        alt: "Jailbreak Changelogs Banner",
      },
    ],
    type: "website",
    siteName: "Jailbreak Changelogs",
    url: "https://jailbreakchangelogs.xyz/values",
  },
  twitter: {
    card: "summary_large_image",
    title: "Roblox Jailbreak Values | Changelogs",
    description:
      "View the most accurate and up-to-date values for all tradeable items in Roblox Jailbreak, from limited vehicles to rare cosmetics.",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/collab/JBCL_X_TC_Logo_Long_Dark_Background.webp",
    ],
  },
};

export default function ValuesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
