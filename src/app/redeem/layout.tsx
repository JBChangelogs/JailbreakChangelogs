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
  },
  twitter: {
    card: "summary_large_image",
    title: "Jailbreak Changelogs Redeem Code - Claim Your Perks",
    description:
      "Redeem your unique code to claim exclusive perks on Jailbreak Changelogs.",
  },
};

export default function RedeemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
