import type { Metadata } from "next";
import { getDupeFinderMaintenanceMetadata } from "@/utils/api/maintenance";

export async function generateMetadata(): Promise<Metadata> {
  const maintenanceMetadata = await getDupeFinderMaintenanceMetadata();
  if (maintenanceMetadata) {
    return maintenanceMetadata;
  }

  return {
    metadataBase: new URL("https://jailbreakchangelogs.com"),
    title: "Dupe Finder",
    description:
      "Find and check for duplicated items in Roblox Jailbreak inventories. Use our dupe finder tool to identify potential duplicate items in your or other players' inventories.",
    alternates: {
      canonical: "/dupes",
    },
    openGraph: {
      title: "Dupe Finder | Jailbreak Changelogs",
      description:
        "Find and check for duplicated items in Roblox Jailbreak inventories. Use our dupe finder tool to identify potential duplicate items in your or other players' inventories.",
      images: [
        {
          url: "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Embed_Graphic.png",
          width: 2400,
          height: 1260,
          alt: "Jailbreak Changelogs Banner",
        },
      ],
      type: "website",
      siteName: "Jailbreak Changelogs",
      url: "https://jailbreakchangelogs.com/dupes",
    },
    twitter: {
      card: "summary_large_image",
      title: "Dupe Finder | Jailbreak Changelogs",
      description:
        "Find and check for duplicated items in Roblox Jailbreak inventories. Use our dupe finder tool to identify potential duplicate items in your or other players' inventories.",
      images: [
        "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Embed_Graphic.png",
      ],
    },
  };
}

export default function DupesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="w-full">{children}</div>;
}
