import { Metadata } from "next";
import { AVAILABLE_CREW_SEASONS } from "@/utils/api";
import { getMaintenanceMetadata } from "@/utils/maintenance";

interface CrewRankLayoutProps {
  params: Promise<{
    rank: string;
  }>;
  searchParams: Promise<{ season?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: CrewRankLayoutProps): Promise<Metadata> {
  const maintenanceMetadata = await getMaintenanceMetadata();
  if (maintenanceMetadata) {
    return maintenanceMetadata;
  }

  // Extract rank from params first
  const { rank } = await params;

  try {
    const resolvedSearchParams = await searchParams;

    // Handle case where searchParams might be undefined
    if (!resolvedSearchParams) {
      return {
        metadataBase: new URL("https://jailbreakchangelogs.xyz"),
        title: "Crew Details - Jailbreak Changelogs",
        description: "View crew details and performance statistics.",
        alternates: {
          canonical: `/crews/${rank}`,
        },
      };
    }

    const seasonParam = resolvedSearchParams.season;
    const selectedSeason = seasonParam ? parseInt(seasonParam, 10) : 19;

    // Validate season parameter
    const validSeason = AVAILABLE_CREW_SEASONS.includes(selectedSeason)
      ? selectedSeason
      : 19;
    const seasonText = validSeason === 19 ? "" : ` (Season ${validSeason})`;

    return {
      metadataBase: new URL("https://jailbreakchangelogs.xyz"),
      title: `Crew Details${seasonText} - Jailbreak Changelogs`,
      description: `View crew details and performance statistics${seasonText}.`,
      alternates: {
        canonical: `/crews/${rank}${validSeason !== 19 ? `?season=${validSeason}` : ""}`,
      },
      openGraph: {
        title: `Crew Details${seasonText}`,
        description: `View crew details and performance statistics${seasonText}.`,
        type: "website",
        siteName: "Jailbreak Changelogs",
        url: `/crews/${rank}${validSeason !== 19 ? `?season=${validSeason}` : ""}`,
        images: [
          {
            url: `/api/og/crew?rank=${rank}`,
            width: 1200,
            height: 630,
            alt: `Crew Details${seasonText}`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `Crew Details${seasonText}`,
        description: `View crew details and performance statistics${seasonText}.`,
        images: [`/api/og/crew?rank=${rank}`],
      },
    };
  } catch (error) {
    console.error("Error generating crew metadata:", error);

    // Final fallback
    return {
      metadataBase: new URL("https://jailbreakchangelogs.xyz"),
      title: "Crew Details - Jailbreak Changelogs",
      description: "View crew details and performance statistics.",
      alternates: {
        canonical: `/crews/${rank}`,
      },
    };
  }
}

export default function CrewRankLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
