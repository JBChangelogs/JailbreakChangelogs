import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Value Calculator",
  description: "Calculate the value of your Roblox Jailbreak items and trades",
  openGraph: {
    title: "Value Calculator",
    description:
      "Calculate the value of your Roblox Jailbreak items and trades",
    type: "website",
    images: [
      {
        url: "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Light_Background.png",
        width: 1200,
        height: 630,
        alt: "Value Calculator Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Value Calculator",
    description:
      "Calculate the value of your Roblox Jailbreak items and trades",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Light_Background.png",
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
