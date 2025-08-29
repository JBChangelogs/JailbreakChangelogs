import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://jailbreakchangelogs.xyz'),
  title: 'OG Finder - Jailbreak Changelogs',
  description: 'Find original items owned by any player. Discover who originally owned specific items in Jailbreak and track their trade history.',
  alternates: {
    canonical: '/og',
  },
  openGraph: {
    title: 'OG Finder - Jailbreak Changelogs',
    description: 'Find original items owned by any player. Discover who originally owned specific items in Jailbreak and track their trade history.',
    type: 'website',
    siteName: 'Jailbreak Changelogs',
    url: 'https://jailbreakchangelogs.xyz/og',
    images: [
      {
        url: "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp",
        width: 1200,
        height: 630,
        alt: "Jailbreak Changelogs OG Finder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: 'OG Finder - Jailbreak Changelogs',
    description: 'Find original items owned by any player. Discover who originally owned specific items in Jailbreak and track their trade history.',
    images: ["https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp"],
  },
};

export default function OGFinderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      {children}
    </div>
  );
}
