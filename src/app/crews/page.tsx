import { Suspense } from "react";
import { fetchCrewLeaderboard, AVAILABLE_CREW_SEASONS } from "@/utils/api";
import CrewLeaderboard from "@/components/Crews/CrewLeaderboard";
import CrewSeasonSelector from "@/components/Crews/CrewSeasonSelector";
import Breadcrumb from "@/components/Layout/Breadcrumb";

export const dynamic = "force-dynamic";

interface CrewsPageProps {
  searchParams: Promise<{ season?: string }>;
}

export default async function CrewsPage({ searchParams }: CrewsPageProps) {
  const resolvedSearchParams = await searchParams;
  const seasonParam = resolvedSearchParams.season;
  const selectedSeason = seasonParam ? parseInt(seasonParam, 10) : 19;

  // Validate season parameter
  const validSeason = AVAILABLE_CREW_SEASONS.includes(selectedSeason)
    ? selectedSeason
    : 19;

  const leaderboard = await fetchCrewLeaderboard(validSeason);

  return (
    <div className="min-h-screen bg-[#2E3944] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb />
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <h1 className="text-4xl font-bold text-gray-100">
                Crew Leaderboard
              </h1>
              <span className="rounded bg-[#5865F2] px-1.5 py-0.5 text-[10px] font-semibold text-white uppercase">
                New
              </span>
            </div>
            <p className="text-lg text-gray-400">
              Top crews in Roblox Jailbreak based on their battle performance
              and rating.
            </p>
          </div>

          <Suspense fallback={<CrewLeaderboardSkeleton />}>
            <CrewSeasonSelector currentSeason={validSeason} />
            <CrewLeaderboard
              leaderboard={leaderboard}
              currentSeason={validSeason}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function CrewLeaderboardSkeleton() {
  return (
    <div className="mt-8">
      <h2 className="mb-4 text-xl font-bold text-gray-300">Crew Leaderboard</h2>
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4 shadow-sm">
        <div className="max-h-[48rem] space-y-3 overflow-y-auto pr-2">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="flex animate-pulse items-center gap-3 rounded-lg border border-[#37424D] bg-[#2E3944] p-3"
            >
              <div className="h-8 w-8 rounded-full bg-gray-600"></div>
              <div className="flex-1">
                <div className="mb-2 h-4 w-3/4 rounded bg-gray-600"></div>
                <div className="h-3 w-1/2 rounded bg-gray-700"></div>
              </div>
              <div className="text-right">
                <div className="mb-1 h-4 w-16 rounded bg-gray-600"></div>
                <div className="h-3 w-12 rounded bg-gray-700"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
