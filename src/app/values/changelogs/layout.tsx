import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Value Changelogs',
  description: 'View the history of value changes for all tradeable items in Roblox Jailbreak',
  openGraph: {
    title: 'Value Changelogs',
    description: 'View the history of value changes for all tradeable items in Roblox Jailbreak',
    type: 'website',
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
    title: 'Value Changelogs',
    description: 'View the history of value changes for all tradeable items in Roblox Jailbreak',
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