import { withDiscordEmbed } from "@/lib/discord-embed";
import React from "react";
import { Metadata } from "next";
import { getMaintenanceMetadata } from "@/utils/api/maintenance";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Check for maintenance mode first
  const maintenanceMetadata = await getMaintenanceMetadata();
  if (maintenanceMetadata) {
    return withDiscordEmbed(
      maintenanceMetadata,
      `/trading/ad/${encodeURIComponent((await params).id)}`,
    );
  }

  const { id } = await params;

  const metadata: Metadata = {
    title: `Trade #${id}`,
    description: "View and interact with this trade offer.",
    openGraph: {
      title: `Trade #${id}`,
      description: "View and interact with this trade offer.",
      type: "website",
      images: [
        {
          url: "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_X_TC_Embed_Graphic.png",
          width: 2400,
          height: 1260,
          alt: "Trade Offer Banner",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Trade #${id}`,
      description: "View and interact with this trade offer.",
      images: [
        "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_X_TC_Embed_Graphic.png",
      ],
    },
  };
  return withDiscordEmbed(
    metadata,
    `/trading/ad/${encodeURIComponent((await params).id)}`,
  );
}

export default function TradeAdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
