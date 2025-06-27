import React from 'react';
import { Metadata } from 'next';
import { getMaintenanceMetadata } from '@/utils/maintenance';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Check for maintenance mode first
  const maintenanceMetadata = await getMaintenanceMetadata();
  if (maintenanceMetadata) {
    return maintenanceMetadata;
  }

  const { id } = await params;
  
  return {
    title: `Trade #${id}`,
    description: 'View and interact with this trade offer.',
    openGraph: {
      title: `Trade #${id}`,
      description: 'View and interact with this trade offer.',
      type: 'website',
      images: [
        {
          url: "https://assets.jailbreakchangelogs.xyz/assets/logos/collab/JBCL_X_TC_Logo_Long_Dark_Background.webp",
          width: 1200,
          height: 630,
          alt: "Trade Offer Banner",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Trade #${id}`,
      description: 'View and interact with this trade offer.',
      images: ["https://assets.jailbreakchangelogs.xyz/assets/logos/collab/JBCL_X_TC_Logo_Long_Dark_Background.webp"],
    },
  };
}

export default function TradeAdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 