import type { Metadata } from "next";
import { withDiscordEmbed } from "@/lib/discord-embed";
const pageMetadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.com"),
  title: {
    template: "%s | Jailbreak Changelogs",
    default: "Users",
  },
  description:
    "Search for users on Jailbreak Changelogs and manage your own profile. Engage with the community through comments and track your contributions!",
  alternates: {
    canonical: "/users",
  },
  openGraph: {
    title: "User Search - Find Community Members",
    description:
      "Search for users on Jailbreak Changelogs and manage your own profile. Engage with the community through comments and track your contributions!",
    images: [
      {
        url: "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Halloween_Banner.png",
        width: 2400,
        height: 1260,
        alt: "Jailbreak Changelogs Banner",
      },
    ],
    type: "website",
    siteName: "Jailbreak Changelogs",
    url: "https://jailbreakchangelogs.com/users",
  },
  twitter: {
    card: "summary_large_image",
    title: "User Search - Find Community Members",
    description:
      "Search for users on Jailbreak Changelogs and manage your own profile. Engage with the community through comments and track your contributions!",
    images: [
      "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Halloween_Banner.png",
    ],
  },
};

export const metadata = withDiscordEmbed(pageMetadata, "/users");

export default function ValuesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
