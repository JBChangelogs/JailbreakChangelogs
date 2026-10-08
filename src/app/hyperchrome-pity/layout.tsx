import { withDiscordEmbed } from "@/lib/discord-embed";
import { Metadata } from "next";

const pageMetadata: Metadata = {
  title: "Hyperchrome Pity Calculator",
  description:
    "Estimate robberies needed for your next Hyperchrome level and compare pity progression between big and small servers.",
  alternates: {
    canonical: "/hyperchrome-pity",
  },
  openGraph: {
    title: "Hyperchrome Pity Calculator | Jailbreak Changelogs",
    description:
      "Estimate robberies needed for your next Hyperchrome level and compare pity progression between big and small servers.",
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
    url: "https://jailbreakchangelogs.com/hyperchrome-pity",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hyperchrome Pity Calculator | Jailbreak Changelogs",
    description:
      "Estimate robberies needed for your next Hyperchrome level and compare pity progression between big and small servers.",
    images: [
      "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Halloween_Banner.png",
    ],
  },
};

export const metadata = withDiscordEmbed(pageMetadata, "/hyperchrome-pity");

export default function HyperchromeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
