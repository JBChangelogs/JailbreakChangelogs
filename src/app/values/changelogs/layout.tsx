import { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://jailbreakchangelogs.xyz'),
  title: 'Roblox Jailbreak Values Changelogs & History',
  description: 'Track every value change, price adjustment, and item modification in Jailbreak Changelogs. View comprehensive changelog history for all tradeable items.',
  alternates: {
    canonical: '/values/changelogs',
  },
  openGraph: {
    title: 'Roblox Jailbreak Values Changelogs & History',
    description: 'Track every value change, price adjustment, and item modification in Jailbreak Changelogs. View comprehensive changelog history for all tradeable items.',
    type: 'website',
    url: 'https://jailbreakchangelogs.xyz/values/changelogs',
    images: [
      {
        url: "https://assets.jailbreakchangelogs.xyz/assets/logos/collab/JBCL_X_TC_Logo_Long_Dark_Background.webp",
        width: 1200,
        height: 630,
        alt: "Value Changelogs Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: 'Roblox Jailbreak Values Changelogs & History',
    description: 'Track every value change, price adjustment, and item modification in Jailbreak Changelogs. View comprehensive changelog history for all tradeable items.',
    images: ["https://assets.jailbreakchangelogs.xyz/assets/logos/collab/JBCL_X_TC_Logo_Long_Dark_Background.webp"],
  },
};

export default function ChangelogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 