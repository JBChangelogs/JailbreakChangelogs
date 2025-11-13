import { fetchNetworthLeaderboard } from "@/utils/api/api";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import NetworthLeaderboardClient from "@/components/Leaderboard/NetworthLeaderboardClient";
import { checkNetworthLeaderboardMaintenanceMode } from "@/utils/config/maintenance";
import FeatureMaintenance from "@/theme/FeatureMaintenance";

export const revalidate = 1800;
export default async function NetworthLeaderboardPage() {
  // Check for networth leaderboard maintenance mode
  const { isNetworthLeaderboardMaintenanceMode } =
    await checkNetworthLeaderboardMaintenanceMode();
  if (isNetworthLeaderboardMaintenanceMode) {
    return (
      <FeatureMaintenance
        featureName="Networth Leaderboard"
        customMessage="We're experiencing technical difficulties. The Networth Leaderboard is temporarily unavailable. Please try again later."
      />
    );
  }

  const leaderboard = await fetchNetworthLeaderboard();

  return (
    <main className="mb-8 min-h-screen">
      <div className="container mx-auto px-4">
        <Breadcrumb />

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-primary-text text-3xl font-bold">
              Networth Leaderboard
            </h1>
          </div>
          <p className="text-secondary-text mt-2">
            Top players ranked by their total inventory networth in Roblox
            Jailbreak
          </p>
          <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-primary-text text-sm">
              <span className="font-semibold">Note:</span> Leaderboard updates
              every 30 minutes.
            </p>
          </div>
        </div>

        <NetworthLeaderboardClient initialLeaderboard={leaderboard} />
      </div>
    </main>
  );
}
