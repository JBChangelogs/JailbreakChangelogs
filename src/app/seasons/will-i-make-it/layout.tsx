import { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://jailbreakchangelogs.xyz'),
  title: "Will I Make It to Level 10? | Jailbreak Seasons Calculator",
  description: "Calculate your chances of reaching level 10 in the current Jailbreak season. Track your XP progress and see if you'll make it to the top rewards!",
  alternates: {
    canonical: '/seasons/will-i-make-it',
  },
  openGraph: {
    title: "Will I Make It to Level 10? | Jailbreak Seasons Calculator",
    description: "Calculate your chances of reaching level 10 in the current Jailbreak season. Track your XP progress and see if you'll make it to the top rewards!",
    images: [
      {
        url: "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp",
        width: 1200,
        height: 630,
        alt: "Jailbreak Season Level Calculator",
      },
    ],
    siteName: 'Jailbreak Changelogs',
    url: 'https://jailbreakchangelogs.xyz/seasons/will-i-make-it',
  },
  twitter: {
    card: "summary_large_image",
    title: "Will I Make It to Level 10? | Jailbreak Seasons Calculator",
    description: "Calculate your chances of reaching level 10 in the current Jailbreak season. Track your XP progress and see if you'll make it to the top rewards!",
    images: ["https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp"],
  },
};

export default function WillIMakeItLayout({
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