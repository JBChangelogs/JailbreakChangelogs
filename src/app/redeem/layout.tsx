import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Redeem Code',
  description: 'Redeem your unique code to claim exclusive perks on Jailbreak Changelogs.',
  openGraph: {
    title: 'Redeem Code',
    description: 'Redeem your unique code to claim exclusive perks on Jailbreak Changelogs.',
    type: 'website',
    images: [
      {
        url: "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp",
        width: 1200,
        height: 630,
        alt: "Redeem Code Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: 'Redeem Code',
    description: 'Redeem your unique code to claim exclusive perks on Jailbreak Changelogs.',
    images: ["https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp"],
  },
};

export default function RedeemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 