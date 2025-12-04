import { fetchNetworthLeaderboard } from "@/utils/api";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import NetworthLeaderboardClient from "@/components/Leaderboard/NetworthLeaderboardClient";
import { checkNetworthLeaderboardMaintenanceMode } from "@/utils/maintenance";
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
        </div>

        <NetworthLeaderboardClient initialLeaderboard={leaderboard} />
      </div>
    </main>
  );
}
