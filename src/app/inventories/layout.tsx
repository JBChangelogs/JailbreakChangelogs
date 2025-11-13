import type { Metadata } from "next";
import { getInventoryMaintenanceMetadata } from "@/utils/config/maintenance";

export async function generateMetadata(): Promise<Metadata> {
  // Check for inventory maintenance mode first
  const maintenanceMetadata = await getInventoryMaintenanceMetadata();
  if (maintenanceMetadata) {
    return maintenanceMetadata;
  }

  return {
    title: "Inventory Checker - Jailbreak Changelogs",
    description: "Check any player's Jailbreak inventory and stats",
    openGraph: {
      title: "Inventory Checker - Jailbreak Changelogs",
      description: "Check any player's Jailbreak inventory and stats",
      type: "website",
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
