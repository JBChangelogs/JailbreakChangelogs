import { Metadata } from 'next';

export const defaultMetadata: Metadata = {
  metadataBase: new URL('https://jailbreakchangelogs.xyz'),
  title: 'Jailbreak Changelogs & Update History',
  description: 'Track every update, feature release, and game modification in Jailbreak\'s history. Browse through our comprehensive collection of Roblox Jailbreak changelogs.',
  openGraph: {
    title: 'Jailbreak Changelogs & Update History',
    description: 'Track every update, feature release, and game modification in Jailbreak\'s history. Browse through our comprehensive collection of Roblox Jailbreak changelogs.',
    type: 'website',
    siteName: 'Jailbreak Changelogs',
    url: '/changelogs',
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
    card: 'summary_large_image',
    title: 'Jailbreak Changelogs & Update History',
    description: 'Track every update, feature release, and game modification in Jailbreak\'s history. Browse through our comprehensive collection of Roblox Jailbreak changelogs.',
    images: ["https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp"],
  },
}; 