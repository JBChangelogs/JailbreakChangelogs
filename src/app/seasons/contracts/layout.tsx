import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weekly Contracts | Jailbreak Seasons",
  description: "Check the latest weekly contracts for Roblox Jailbreak.",
  alternates: { canonical: "/seasons/contracts" },
  openGraph: {
    title: "Weekly Contracts | Jailbreak Seasons",
    description: "Check the latest weekly contracts for Roblox Jailbreak.",
    siteName: "Jailbreak Changelogs",
    url: "https://jailbreakchangelogs.xyz/seasons/contracts",
  },
  twitter: {
    card: "summary_large_image",
    title: "Weekly Contracts | Jailbreak Seasons",
    description: "Check the latest weekly contracts for Roblox Jailbreak.",
  },
};

export default function ContractsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
