import { Metadata } from 'next';
import { getMaintenanceMetadata } from '@/utils/maintenance';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  // Check for maintenance mode first
  const maintenanceMetadata = await getMaintenanceMetadata();
  if (maintenanceMetadata) {
    return maintenanceMetadata;
  }

  const { id } = await params;
  
  return {
    metadataBase: new URL('https://jailbreakchangelogs.xyz'),
    title: `Value Changelog #${id}`,
    description: `View value changes in this Jailbreak Changelogs Value update.`,
    alternates: {
      canonical: `/values/changelogs/${id}`,
    },
    openGraph: {
      title: `Value Changelog #${id}`,
      description: `View value changes in this Jailbreak Changelogs Value update.`,
      type: 'website',
      url: `https://jailbreakchangelogs.xyz/values/changelogs/${id}`,
      siteName: 'Jailbreak Changelogs',
      images: [
        {
          url: "https://assets.jailbreakchangelogs.xyz/assets/logos/collab/JBCL_X_TC_Logo_Long_Dark_Background.webp",
          width: 1200,
          height: 630,
          alt: "Value Changelog Banner",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Value Changelog #${id}`,
      description: `View value changes in this Jailbreak Changelogs Value update.`,
      images: ["https://assets.jailbreakchangelogs.xyz/assets/logos/collab/JBCL_X_TC_Logo_Long_Dark_Background.webp"],
    },
  };
}

export default function ValueChangelogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 