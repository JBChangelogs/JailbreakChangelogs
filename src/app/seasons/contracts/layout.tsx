import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Weekly Contracts | Jailbreak Seasons',
  description: 'Check the latest weekly contracts for Roblox Jailbreak.',
  alternates: { canonical: '/seasons/contracts' },
  openGraph: {
    title: 'Weekly Contracts | Jailbreak Seasons',
    description: 'Check the latest weekly contracts for Roblox Jailbreak.',
    images: [
      {
        url: 'https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp',
        width: 1200,
        height: 630,
        alt: 'Jailbreak Weekly Contracts',
      },
    ],
    siteName: 'Jailbreak Changelogs',
    url: 'https://jailbreakchangelogs.xyz/seasons/contracts',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Weekly Contracts | Jailbreak Seasons',
    description: 'Check the latest weekly contracts for Roblox Jailbreak.',
    images: ['https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp'],
  },
};

export default function ContractsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}


