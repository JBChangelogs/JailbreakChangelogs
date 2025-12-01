import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.xyz"),
  title: "Support Us - Jailbreak Changelogs",
  description:
    "Support Jailbreak Changelogs and unlock exclusive perks. Choose from various supporter tiers to enhance your experience and help us maintain the platform.",
  alternates: {
    canonical: "/supporting",
  },
  openGraph: {
    title: "Support Us - Jailbreak Changelogs",
    description:
      "Support Jailbreak Changelogs and unlock exclusive perks. Choose from various supporter tiers to enhance your experience and help us maintain the platform.",
    type: "website",
    siteName: "Jailbreak Changelogs",
    url: "https://jailbreakchangelogs.xyz/supporting",
  },
  twitter: {
    card: "summary_large_image",
    title: "Support Jailbreak Changelogs",
    description:
      "Support Jailbreak Changelogs and unlock exclusive perks. Choose from various supporter tiers to enhance your experience and help us maintain the platform.",
  },
};

export default function SupportingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
