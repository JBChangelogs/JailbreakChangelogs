import { withDiscordEmbed } from "@/lib/discord-embed";
import { Metadata } from "next";

const pageMetadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.com"),
  title: "Season XP Calculator Unavailable",
  description:
    "Jailbreak seasons are paused until further notice. The XP calculator is unavailable without an active season. Browse past seasons and their rewards.",
  alternates: {
    canonical: "/seasons/will-i-make-it",
  },
  openGraph: {
    title: "Season XP Calculator Unavailable | Jailbreak Seasons Calculator",
    description:
      "Jailbreak seasons are paused until further notice. The XP calculator is unavailable without an active season. Browse past seasons and their rewards.",
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
    url: "https://jailbreakchangelogs.com/seasons/will-i-make-it",
  },
  twitter: {
    card: "summary_large_image",
    title: "Season XP Calculator Unavailable | Jailbreak Seasons Calculator",
    description:
      "Jailbreak seasons are paused until further notice. The XP calculator is unavailable without an active season. Browse past seasons and their rewards.",
    images: [
      "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Halloween_Banner.png",
    ],
  },
};

export const metadata = withDiscordEmbed(
  pageMetadata,
  "/seasons/will-i-make-it",
);

export default function WillIMakeItLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}
