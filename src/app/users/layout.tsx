import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#124e66",
};

export const metadata = {
    metadataBase: new URL('https://jailbreakchangelogs.xyz'),
    title: "User Search - Find Community Members",
    description: "Search for users on Jailbreak Changelogs and manage your own profile. Engage with the community through comments and track your contributions!",
    alternates: {
        canonical: "/users",
    },
    openGraph: {
      title: "User Search - Find Community Members",
      description: "Search for users on Jailbreak Changelogs and manage your own profile. Engage with the community through comments and track your contributions!.",
      images: [
        {
          url: "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp",
          width: 1200,
          height: 630,
          alt: "Jailbreak Changelogs Banner",
        },
      ],
      type: "website",
      siteName: 'Jailbreak Changelogs',
      url: 'https://jailbreakchangelogs.xyz/users',
    },
    twitter: {
      card: "summary_large_image",
      title: "User Search - Find Community Members",
      description: "Search for users on Jailbreak Changelogs and manage your own profile. Engage with the community through comments and track your contributions!",
      images: ["https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp"],
    },
  };
  
  export default function ValuesLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return children;
  } 