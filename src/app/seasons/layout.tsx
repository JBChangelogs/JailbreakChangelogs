import { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://jailbreakchangelogs.xyz'),
  title: "Jailbreak Seasons | Complete Season Archives",
  description: "Explore every season of Roblox Jailbreak! Each season brings exciting limited-time rewards, exclusive vehicles, and unique customization items.",
  alternates: {
    canonical: '/seasons',
  },
  openGraph: {
    title: "Jailbreak Seasons | Complete Season Archives",
    description: "Explore every season of Roblox Jailbreak! Each season brings exciting limited-time rewards, exclusive vehicles, and unique customization items.",
    images: [
      {
        url: "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp",
        width: 1200,
        height: 630,
        alt: "Jailbreak Seasons Archives",
      },
    ],
    siteName: 'Jailbreak Changelogs',
    url: 'https://jailbreakchangelogs.xyz/seasons',
  },
  twitter: {
    card: "summary_large_image",
    title: "Jailbreak Seasons | Complete Season Archives",
    description: "Explore every season of Roblox Jailbreak! Each season brings exciting limited-time rewards, exclusive vehicles, and unique customization items.",
    images: ["https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp"],
  },
};

export default function SeasonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#2E3944]">
      {children}
    </div>
  );
} 