import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.com"),
  title: "Redeem",
  description:
    "Redeem your unique code to claim exclusive perks on Jailbreak Changelogs.",
  alternates: {
    canonical: "/redeem",
  },
  openGraph: {
    title: "Redeem",
    description:
      "Redeem your unique code to claim exclusive perks on Jailbreak Changelogs.",
    images: [
      {
        url: "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Embed_Graphic.png",
        width: 2400,
        height: 1260,
        alt: "Jailbreak Changelogs Banner",
      },
    ],
    type: "website",
    siteName: "Jailbreak Changelogs",
    url: "https://jailbreakchangelogs.com/redeem",
  },
  twitter: {
    card: "summary_large_image",
    title: "Redeem",
    description:
      "Redeem your unique code to claim exclusive perks on Jailbreak Changelogs.",
    images: [
      "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Embed_Graphic.png",
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
