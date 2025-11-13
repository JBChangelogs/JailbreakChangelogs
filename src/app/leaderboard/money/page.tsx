import { fetchMoneyLeaderboard } from "@/utils/api/api";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import MoneyLeaderboardClient from "@/components/Leaderboard/MoneyLeaderboardClient";
import { checkMoneyLeaderboardMaintenanceMode } from "@/utils/config/maintenance";
import FeatureMaintenance from "@/theme/FeatureMaintenance";

// Cache this page for 30 minutes
export const revalidate = 1800;

export default async function MoneyLeaderboardPage() {
  // Check for money leaderboard maintenance mode
  const { isMoneyLeaderboardMaintenanceMode } =
    await checkMoneyLeaderboardMaintenanceMode();
  if (isMoneyLeaderboardMaintenanceMode) {
    return (
      <FeatureMaintenance
        featureName="Money Leaderboard"
        customMessage="We're experiencing technical difficulties. The Money Leaderboard is temporarily unavailable. Please try again later."
      />
    );
  }

  const leaderboard = await fetchMoneyLeaderboard();

  return (
    <main className="mb-8 min-h-screen">
      <div className="container mx-auto px-4">
        <Breadcrumb />

        <div className="mb-8">
          <div>
            <h1 className="text-primary-text text-3xl font-bold">
              Money Leaderboard
            </h1>
          </div>
          <p className="text-secondary-text mt-2">
            Top players ranked by their total money in Jailbreak
          </p>
          <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-primary-text text-sm">
              <span className="font-semibold">Note:</span> Leaderboard updates
              every 30 minutes.
            </p>
          </div>
        </div>

        <MoneyLeaderboardClient initialLeaderboard={leaderboard} />
      </div>
    </main>
  );
}
