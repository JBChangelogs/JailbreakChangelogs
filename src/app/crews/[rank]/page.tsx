import { fetchCrewLeaderboard, AVAILABLE_CREW_SEASONS } from "@/utils/api";
import { notFound } from "next/navigation";
import CrewDetails from "@/components/Crews/CrewDetails";
import Breadcrumb from "@/components/Layout/Breadcrumb";

export const dynamic = "force-dynamic";

interface CrewPageProps {
  params: Promise<{
    rank: string;
  }>;
  searchParams: Promise<{ season?: string }>;
}

export default async function CrewPage({
  params,
  searchParams,
}: CrewPageProps) {
  const { rank } = await params;
  const rankNumber = parseInt(rank);

  if (isNaN(rankNumber) || rankNumber < 1) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const seasonParam = resolvedSearchParams.season;
  const selectedSeason = seasonParam ? parseInt(seasonParam, 10) : 19;

  // Validate season parameter
  const validSeason = AVAILABLE_CREW_SEASONS.includes(selectedSeason)
    ? selectedSeason
    : 19;

  const leaderboard = await fetchCrewLeaderboard(validSeason);

  // Check if the requested rank is within bounds
  if (rankNumber > leaderboard.length) {
    // Instead of notFound(), let's show a more helpful error
    return (
      <div className="text-primary-text min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-6xl">
            <Breadcrumb />

            <div className="mb-6">
              <div className="mb-4 flex items-center gap-3">
                <h1 className="text-primary-text text-4xl font-bold">
                  Crew Not Found
                </h1>
              </div>
            </div>

            <div className="border-border-primary hover:border-border-focus bg-secondary-bg rounded-lg border p-8 text-center">
              <h2 className="text-primary-text mb-4 text-2xl font-bold">
                Rank #{rankNumber} Not Available
              </h2>
              <p className="text-secondary-text mb-6">
                Season {validSeason} only has {leaderboard.length} crews
                available. Rank #{rankNumber} is out of bounds.
              </p>
              <div className="space-y-2">
                <p className="text-tertiary-text text-sm">
                  Available ranks: 1 - {leaderboard.length}
                </p>
                <p className="text-tertiary-text text-sm">
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
    <div className="min-h-screen text-white">
      <div className="container mx-auto px-4 pb-8">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb />

          <div className="mb-6">
            <div className="mb-4">
              <h1 className="text-primary-text text-4xl font-bold">
                Crew Details
              </h1>
            </div>
          </div>

          <div className="border-border-primary bg-button-info/10 mb-6 flex items-start gap-4 rounded-lg border p-4 shadow-sm">
            <div className="relative z-10">
              <span className="text-primary-text text-base font-bold">
                Notice
              </span>
              <div className="text-secondary-text mt-1">
                Badimo&apos;s crew data has not been updated since{" "}
                <span className="font-bold">Sep 29, 2025</span>. This is an
                upstream issue; we cannot refresh the data until it is resolved.
                Please reach out to{" "}
                <a
                  href="https://x.com/badimo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-button-info hover:text-button-info-hover font-semibold underline transition-colors"
                >
                  @badimo
                </a>{" "}
                on X to look into it.
              </div>
            </div>
          </div>

          <CrewDetails
            crew={crew}
            rank={rankNumber}
            currentSeason={validSeason}
          />
        </div>
      </div>
    </div>
  );
}
