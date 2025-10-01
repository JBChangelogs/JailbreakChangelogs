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
    <div className="text-primary-text mb-8 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb />
          <div className="mb-8">
            <div className="mb-4">
              <h1 className="text-primary-text text-4xl font-bold">
                Crew Leaderboard
              </h1>
            </div>
            <p className="text-secondary-text text-lg">
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
      <h2 className="text-primary-text mb-4 text-xl font-bold">
        Crew Leaderboard
      </h2>
      <div className="border-border-primary hover:border-border-focus bg-secondary-bg rounded-lg border p-4 shadow-sm">
        <div className="max-h-[48rem] space-y-3 overflow-y-auto pr-2">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="border-border-primary flex animate-pulse items-center gap-3 rounded-lg border p-3"
            >
              <div className="bg-secondary-bg h-8 w-8 rounded-full"></div>
              <div className="flex-1">
                <div className="bg-secondary-bg mb-2 h-4 w-3/4 rounded"></div>
                <div className="bg-secondary-bg h-3 w-1/2 rounded"></div>
              </div>
              <div className="text-right">
                <div className="bg-secondary-bg mb-1 h-4 w-16 rounded"></div>
                <div className="bg-secondary-bg h-3 w-12 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
