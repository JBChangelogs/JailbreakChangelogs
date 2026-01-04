import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Value Calculator",
  description: "Calculate the value of your Roblox Jailbreak items and trades",
  metadataBase: new URL("https://jailbreakchangelogs.xyz"),
  openGraph: {
    title: "Value Calculator",
    description:
      "Calculate the value of your Roblox Jailbreak items and trades",
    images: [
      {
        url: "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_X_TC_Embed_Graphic.png",
        width: 2400,
        height: 1260,
        alt: "Jailbreak Changelogs Banner",
      },
    ],
    type: "website",
    siteName: "Jailbreak Changelogs",
    url: "https://jailbreakchangelogs.xyz/values/calculator",
  },
  twitter: {
    card: "summary_large_image",
    title: "Value Calculator",
    description:
      "Calculate the value of your Roblox Jailbreak items and trades",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_X_TC_Embed_Graphic.png",
    ],
  },
};

export default function CalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
