import { fetchCrewLeaderboard, AVAILABLE_CREW_SEASONS } from '@/utils/api';
import { notFound } from 'next/navigation';
import CrewDetails from '@/components/Crews/CrewDetails';
import Breadcrumb from '@/components/Layout/Breadcrumb';

export const dynamic = 'force-dynamic';

interface CrewPageProps {
  params: Promise<{
    rank: string;
  }>;
  searchParams: Promise<{ season?: string }>;
}

export default async function CrewPage({ params, searchParams }: CrewPageProps) {
  const { rank } = await params;
  const rankNumber = parseInt(rank);
  
  if (isNaN(rankNumber) || rankNumber < 1) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const seasonParam = resolvedSearchParams.season;
  const selectedSeason = seasonParam ? parseInt(seasonParam, 10) : 19;
  
  // Validate season parameter
  const validSeason = AVAILABLE_CREW_SEASONS.includes(selectedSeason) ? selectedSeason : 19;

  const leaderboard = await fetchCrewLeaderboard(validSeason);
  
  // Check if the requested rank is within bounds
  if (rankNumber > leaderboard.length) {
    // Instead of notFound(), let's show a more helpful error
    return (
      <div className="min-h-screen bg-[#2E3944] text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <Breadcrumb />
            
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-4xl font-bold text-gray-100">Crew Not Found</h1>
              </div>
            </div>

            <div className="bg-[#212A31] rounded-lg p-8 border border-[#2E3944] text-center">
              <h2 className="text-2xl font-bold text-gray-100 mb-4">Rank #{rankNumber} Not Available</h2>
              <p className="text-gray-400 mb-6">
                Season {validSeason} only has {leaderboard.length} crews available. 
                Rank #{rankNumber} is out of bounds.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Available ranks: 1 - {leaderboard.length}
                </p>
                <p className="text-sm text-gray-500">
                  Try viewing a crew from the available ranks above.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const crew = leaderboard[rankNumber - 1]; // Convert 1-based rank to 0-based index

  if (!crew) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#2E3944] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Breadcrumb />
          
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-4xl font-bold text-gray-100">Crew Details</h1>
              <span className="text-[10px] uppercase font-semibold text-white bg-[#5865F2] px-1.5 py-0.5 rounded">New</span>
            </div>
          </div>

          <CrewDetails crew={crew} rank={rankNumber} currentSeason={validSeason} />
        </div>
      </div>
    </div>
  );
}
