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
    url: "https://jailbreakchangelogs.xyz/redeem",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jailbreak Changelogs Redeem Code - Claim Your Perks",
    description:
      "Redeem your unique code to claim exclusive perks on Jailbreak Changelogs.",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
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
