import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.xyz"),
  title: "Jailbreak Changelogs Redeem Code - Claim Your Perks",
  description:
    "Redeem your unique code to claim exclusive perks on Jailbreak Changelogs.",
  alternates: {
    canonical: "/redeem",
  },
  openGraph: {
    title: "Jailbreak Changelogs Redeem Code - Claim Your Perks",
    description:
      "Redeem your unique code to claim exclusive perks on Jailbreak Changelogs.",
    type: "website",
    url: "https://jailbreakchangelogs.xyz/redeem",
    images: [
      {
        url: "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp",
        width: 1200,
        height: 630,
        alt: "Redeem Code Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jailbreak Changelogs Redeem Code - Claim Your Perks",
    description:
      "Redeem your unique code to claim exclusive perks on Jailbreak Changelogs.",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp",
    ],
  },
};

export default function RedeemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
