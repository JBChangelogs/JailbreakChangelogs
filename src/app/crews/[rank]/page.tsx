import { fetchCrewLeaderboard } from '@/utils/api';
import { notFound } from 'next/navigation';
import CrewDetails from '@/components/Crews/CrewDetails';
import Breadcrumb from '@/components/Layout/Breadcrumb';

export const dynamic = 'force-dynamic';

interface CrewPageProps {
  params: Promise<{
    rank: string;
  }>;
}

export default async function CrewPage({ params }: CrewPageProps) {
  const { rank } = await params;
  const rankNumber = parseInt(rank);
  
  if (isNaN(rankNumber) || rankNumber < 1) {
    notFound();
  }

  const leaderboard = await fetchCrewLeaderboard();
  const crew = leaderboard[rankNumber - 1]; // Convert 1-based rank to 0-based index

  if (!crew) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#2E3944] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Breadcrumb />
          <CrewDetails crew={crew} rank={rankNumber} />
        </div>
      </div>
    </div>
  );
}
