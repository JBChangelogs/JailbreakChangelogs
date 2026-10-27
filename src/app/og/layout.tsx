import { withDiscordEmbed } from "@/lib/discord-embed";
import type { Metadata } from "next";
import { getOGFinderMaintenanceMetadata } from "@/utils/api/maintenance";

export async function generateMetadata(): Promise<Metadata> {
  const maintenanceMetadata = await getOGFinderMaintenanceMetadata();
  if (maintenanceMetadata) {
    return withDiscordEmbed(maintenanceMetadata, `/og`);
  }

  const metadata: Metadata = {
    metadataBase: new URL("https://jailbreakchangelogs.com"),
    title: "OG Finder",
    description:
      "Find the OG items you traded away in Jailbreak and see who owns them now. Enter any Roblox username or ID to track where your originals ended up.",
    alternates: {
      canonical: "/og",
    },
    openGraph: {
      title: "OG Finder - Jailbreak Changelogs",
      description:
        "Find the OG items you traded away in Jailbreak and see who owns them now. Enter any Roblox username or ID to track where your originals ended up.",
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
      url: "https://jailbreakchangelogs.com/og",
    },
    twitter: {
      card: "summary_large_image",
      title: "OG Finder - Jailbreak Changelogs",
      description:
        "Find the OG items you traded away in Jailbreak and see who owns them now. Enter any Roblox username or ID to track where your originals ended up.",
      images: [
        "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Halloween_Banner.png",
      ],
    },
  };
  return withDiscordEmbed(metadata, `/og`);
}

export default function OGFinderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="w-full">{children}</div>;
}
