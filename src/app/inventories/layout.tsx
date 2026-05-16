import type { Metadata } from "next";
import { getInventoryMaintenanceMetadata } from "@/utils/api/maintenance";

export async function generateMetadata(): Promise<Metadata> {
  // Check for inventory maintenance mode first
  const maintenanceMetadata = await getInventoryMaintenanceMetadata();
  if (maintenanceMetadata) {
    return maintenanceMetadata;
  }

  return {
    title: "Inventory Checker",
    description: "Check any player's Jailbreak inventory and stats",
    metadataBase: new URL("https://jailbreakchangelogs.com"),
    alternates: {
      canonical: "/inventories",
    },
    openGraph: {
      title: "Inventory Checker - Jailbreak Changelogs",
      description: "Check any player's Jailbreak inventory and stats",
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
      url: "https://jailbreakchangelogs.com/inventories",
    },
    twitter: {
      card: "summary_large_image",
      title: "Inventory Checker - Jailbreak Changelogs",
      description: "Check any player's Jailbreak inventory and stats",
      images: [
        "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Embed_Graphic.png",
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
