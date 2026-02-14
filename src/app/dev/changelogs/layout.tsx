import { siteConfig } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Development Changelog",
  description: siteConfig.description,
  openGraph: {
    title: "Development Changelog",
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [
      {
        url: "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Website_Embed_Graphic_DevLogs.png",
        width: 1200,
        height: 630,
        alt: "Development Changelog",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Development Changelog",
    description: siteConfig.description,
    creator: "@jbchangelogs",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Website_Embed_Graphic_DevLogs.png",
    ],
  },
};

export default function ChangelogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
