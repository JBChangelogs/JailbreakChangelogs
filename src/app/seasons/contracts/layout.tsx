import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weekly Contracts",
  description: "Check the latest weekly contracts for Roblox Jailbreak.",
  alternates: { canonical: "/seasons/contracts" },
  openGraph: {
    title: "Weekly Contracts | Jailbreak Seasons",
    description: "Check the latest weekly contracts for Roblox Jailbreak.",
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
    url: "https://jailbreakchangelogs.xyz/seasons/contracts",
  },
  twitter: {
    card: "summary_large_image",
    title: "Weekly Contracts | Jailbreak Seasons",
    description: "Check the latest weekly contracts for Roblox Jailbreak.",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
    ],
  },
};

export default function ContractsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
