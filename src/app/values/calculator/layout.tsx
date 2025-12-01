import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Value Calculator",
  description: "Calculate the value of your Roblox Jailbreak items and trades",
  openGraph: {
    title: "Value Calculator",
    description:
      "Calculate the value of your Roblox Jailbreak items and trades",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Value Calculator",
    description:
      "Calculate the value of your Roblox Jailbreak items and trades",
  },
};

export default function CalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
