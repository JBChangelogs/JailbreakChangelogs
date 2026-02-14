import type { Metadata } from "next";
import { getInventoryMaintenanceMetadata } from "@/utils/maintenance";

export async function generateMetadata(): Promise<Metadata> {
  // Check for inventory maintenance mode first
  const maintenanceMetadata = await getInventoryMaintenanceMetadata();
  if (maintenanceMetadata) {
    return maintenanceMetadata;
  }

  return {
    title: "Inventory Checker",
    description: "Check any player's Jailbreak inventory and stats",
    metadataBase: new URL("https://jailbreakchangelogs.xyz"),
    alternates: {
      canonical: "/inventories",
    },
    openGraph: {
      title: "Inventory Checker - Jailbreak Changelogs",
      description: "Check any player's Jailbreak inventory and stats",
      images: [
        {
          url: "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
          width: 2400,
          height: 1260,
          alt: "Jailbreak Changelogs Banner",
        },
      ],
      type: "website",
      siteName: "Jailbreak Changelogs",
      url: "https://jailbreakchangelogs.xyz/inventories",
    },
    twitter: {
      card: "summary_large_image",
      title: "Inventory Checker - Jailbreak Changelogs",
      description: "Check any player's Jailbreak inventory and stats",
      images: [
        "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
      ],
    },
  };
}

export default function InventoryCheckerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="w-full">{children}</div>;
}
