import { Metadata } from 'next';
import { fetchCrewLeaderboard } from '@/utils/api';
import { getMaintenanceMetadata } from '@/utils/maintenance';

interface CrewRankLayoutProps {
  params: Promise<{
    rank: string;
  }>;
}

export async function generateMetadata({ params }: CrewRankLayoutProps): Promise<Metadata> {
  // Check for maintenance mode first
  const maintenanceMetadata = await getMaintenanceMetadata();
  if (maintenanceMetadata) {
    return maintenanceMetadata;
  }

  // Extract rank from params first
  const { rank } = await params;

  try {
    const rankNumber = parseInt(rank);
    const leaderboard = await fetchCrewLeaderboard();
    const crew = leaderboard[rankNumber - 1]; // Convert 1-based rank to 0-based index

    if (!crew) {
      return {
        metadataBase: new URL('https://jailbreakchangelogs.xyz'),
        title: 'Crew Not Found - Jailbreak Changelogs',
        description: 'The requested crew could not be found.',
        alternates: {
          canonical: `/crews/${rank}`,
        },
      };
    }

    return {
      metadataBase: new URL('https://jailbreakchangelogs.xyz'),
      title: `${crew.ClanName} - Rank #${rank} - Jailbreak Changelogs`,
      description: `${crew.ClanName} is ranked #${rank} in Jailbreak with a rating of ${Math.round(crew.Rating)} and ${crew.BattlesPlayed} battles played.`,
      alternates: {
        canonical: `/crews/${rank}`,
      },
      openGraph: {
        title: `${crew.ClanName} - Rank #${rank}`,
        description: `${crew.ClanName} is ranked #${rank} in Jailbreak with a rating of ${Math.round(crew.Rating)} and ${crew.BattlesPlayed} battles played.`,
        type: 'website',
        siteName: 'Jailbreak Changelogs',
        url: `/crews/${rank}`,
        images: [
          {
            url: `/api/og/crew?rank=${rank}`,
            width: 1200,
            height: 630,
            alt: `${crew.ClanName} - Rank #${rank}`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${crew.ClanName} - Rank #${rank}`,
        description: `${crew.ClanName} is ranked #${rank} in Jailbreak with a rating of ${Math.round(crew.Rating)} and ${crew.BattlesPlayed} battles played.`,
        images: [`/api/og/crew?rank=${rank}`],
      },
    };
  } catch {
    return {
      metadataBase: new URL('https://jailbreakchangelogs.xyz'),
      title: 'Crew Not Found - Jailbreak Changelogs',
      description: 'The requested crew could not be found.',
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
