import { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://jailbreakchangelogs.xyz'),
  title: 'Crew Leaderboard - Jailbreak Changelogs',
  description: 'View the top crews in Roblox Jailbreak based on their battle performance and rating. See crew rankings, win rates, and member counts.',
  alternates: {
    canonical: '/crews',
  },
  openGraph: {
    title: 'Crew Leaderboard - Jailbreak Changelogs',
    description: 'View the top crews in Roblox Jailbreak based on their battle performance and rating. See crew rankings, win rates, and member counts.',
    type: 'website',
    siteName: 'Jailbreak Changelogs',
    url: 'https://jailbreakchangelogs.xyz/crews',
    images: [
      {
        url: 'https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp',
        width: 1200,
        height: 630,
        alt: 'Jailbreak Changelogs Crew Leaderboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crew Leaderboard - Jailbreak Changelogs',
    description: 'View the top crews in Roblox Jailbreak based on their battle performance and rating. See crew rankings, win rates, and member counts.',
    images: ['https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp'],
  },
};

export default function CrewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
