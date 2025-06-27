import { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://jailbreakchangelogs.xyz'),
  title: "Support Us",
  description: "Support Jailbreak Changelogs and unlock exclusive perks. Choose from various supporter tiers to enhance your experience and help us maintain the platform.",
  alternates: {
    canonical: "/supporting",
  },
  openGraph: {
    title: "Support Us",
    description: "Support Jailbreak Changelogs and unlock exclusive perks. Choose from various supporter tiers to enhance your experience and help us maintain the platform.",
    type: "website",
    siteName: 'Jailbreak Changelogs',
    url: 'https://jailbreakchangelogs.xyz/supporting',
    images: [
      {
        url: "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp",
        width: 1200,
        height: 630,
        alt: "Jailbreak Changelogs Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Support Jailbreak Changelogs",
    description: "Support Jailbreak Changelogs and unlock exclusive perks. Choose from various supporter tiers to enhance your experience and help us maintain the platform.",
    images: ["https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp"],
  },
};

export default function SupportingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 