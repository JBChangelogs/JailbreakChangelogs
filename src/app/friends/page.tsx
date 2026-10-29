import { withDiscordEmbed } from "@/lib/discord-embed";
import type { Metadata } from "next";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { FriendsPage } from "@/components/Users/Friends";

const BANNER =
  "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Halloween_Banner.png";

export const metadata: Metadata = withDiscordEmbed(
  {
    title: "Friends",
    description: "Your friends and friend requests.",
    robots: { index: false },
    alternates: { canonical: "/friends" },
    openGraph: {
      title: "Friends",
      description: "Your friends and friend requests.",
      images: [
        {
          url: BANNER,
          width: 2400,
          height: 1260,
          alt: "Jailbreak Changelogs Banner",
        },
      ],
      type: "website",
      siteName: "Jailbreak Changelogs",
      url: "https://jailbreakchangelogs.com/friends",
    },
    twitter: {
      card: "summary_large_image",
      title: "Friends",
      description: "Your friends and friend requests.",
      images: [BANNER],
    },
  },
  "/friends",
);

export default function Page() {
  return (
    <main className="container mx-auto min-h-screen px-4 pb-6">
      <Breadcrumb containerClassName="mx-auto max-w-5xl py-4" />
      <FriendsPage />
    </main>
  );
}
