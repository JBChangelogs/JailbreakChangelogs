import { Metadata } from 'next';
import { fetchSeasonsList, Season, Reward } from '@/utils/api';
import { getMaintenanceMetadata } from '@/utils/maintenance';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Check for maintenance mode first
  const maintenanceMetadata = await getMaintenanceMetadata();
  if (maintenanceMetadata) {
    return maintenanceMetadata;
  }

  try {
    const { id } = await params;
    const seasons = await fetchSeasonsList();
    const season = seasons.find((s: Season) => s.season.toString() === id);

    if (!season) {
      return {
        metadataBase: new URL('https://jailbreakchangelogs.xyz'),
        title: "Season Not Found",
        description: "The requested season could not be found.",
        alternates: {
          canonical: `/seasons/${id}`,
        },
      };
    }

    // Get all level rewards with images
    const validRewards = season.rewards.filter(
      (reward: Reward) => 
        reward.requirement.startsWith("Level") && 
        reward.link !== "N/A" && 
        reward.link !== null
    );

    // Shuffle and take 4 images
    const shuffledRewards = validRewards.sort(() => Math.random() - 0.5).slice(0, 4);
    const images = shuffledRewards.map((reward: Reward) => ({
      url: `https://assets.jailbreakchangelogs.xyz${reward.link}`,
      width: 1200,
      height: 630,
      alt: `${reward.item} - Season ${season.season} Reward`,
    }));

    return {
      metadataBase: new URL('https://jailbreakchangelogs.xyz'),
      title: `Season ${season.season}: ${season.title}`,
      description: season.description,
      alternates: {
        canonical: `/seasons/${id}`,
      },
      openGraph: {
        title: `Season ${season.season}: ${season.title}`,
        description: season.description,
        images,
        siteName: 'Jailbreak Changelogs',
        url: `https://jailbreakchangelogs.xyz/seasons/${id}`,
      },
      twitter: {
        card: "summary_large_image",
        title: `Season ${season.season}: ${season.title}`,
        description: season.description,
        images: images.map((img: { url: string }) => img.url),
      },
    };
  } catch {
    const { id } = await params;
    return {
      metadataBase: new URL('https://jailbreakchangelogs.xyz'),
      title: "Jailbreak Seasons",
      description: "Explore all seasons of Roblox Jailbreak.",
      alternates: {
        canonical: `/seasons/${id}`,
      },
      openGraph: {
        title: "Jailbreak Seasons",
        description: "Explore all seasons of Roblox Jailbreak.",
        siteName: 'Jailbreak Changelogs',
        url: `https://jailbreakchangelogs.xyz/seasons/${id}`,
      },
    };
  }
}

export default function SeasonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#2E3944]">
      {children}
    </div>
  );
} 