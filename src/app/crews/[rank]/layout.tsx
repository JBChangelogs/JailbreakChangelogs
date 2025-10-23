import { Metadata } from "next";
import { getMaintenanceMetadata } from "@/utils/maintenance";

interface CrewRankLayoutProps {
  params: Promise<{
    rank: string;
  }>;
  searchParams: Promise<{ season?: string }>;
}

export async function generateMetadata({
  params,
}: CrewRankLayoutProps): Promise<Metadata> {
  const maintenanceMetadata = await getMaintenanceMetadata();
  if (maintenanceMetadata) {
    return maintenanceMetadata;
  }

  const { rank } = await params;

  return {
    metadataBase: new URL("https://jailbreakchangelogs.xyz"),
    title: "Crew Details - Jailbreak Changelogs",
    description: "View crew details and performance statistics.",
    alternates: {
      canonical: `/crews/${rank}`,
    },
    openGraph: {
      title: "Crew Details",
      description: "View crew details and performance statistics.",
      type: "website",
      siteName: "Jailbreak Changelogs",
      url: `/crews/${rank}`,
      images: [
        {
          url: `/api/og/crew?rank=${rank}`,
          width: 1200,
          height: 630,
          alt: "Crew Details",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Crew Details",
      description: "View crew details and performance statistics.",
      images: [`/api/og/crew?rank=${rank}`],
    },
  };
}

export default function CrewRankLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
