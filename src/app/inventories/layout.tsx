import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inventory Checker - Jailbreak Changelogs",
  description: "Check any player's Jailbreak inventory and stats",
  openGraph: {
    title: "Inventory Checker - Jailbreak Changelogs",
    description: "Check any player's Jailbreak inventory and stats",
    type: "website",
  },
};

export default function InventoryCheckerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="w-full">{children}</div>;
}
