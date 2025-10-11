import { fetchMoneyLeaderboard } from "@/utils/api";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import MoneyLeaderboardClient from "@/components/Leaderboard/MoneyLeaderboardClient";

// Cache this page for 30 minutes
export const revalidate = 1800;

export default async function MoneyLeaderboardPage() {
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
          <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 p-3 dark:bg-blue-900/20 dark:border-blue-800">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
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
