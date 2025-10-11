import { fetchNetworthLeaderboard } from "@/utils/api";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import NetworthLeaderboardClient from "@/components/Leaderboard/NetworthLeaderboardClient";

export const revalidate = 1800;
export default async function NetworthLeaderboardPage() {
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
            <span className="bg-button-info text-form-button-text rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
              New
            </span>
          </div>
          <p className="text-secondary-text mt-2">
            Top players ranked by their total inventory networth in Roblox
            Jailbreak
          </p>
          <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 p-3 dark:bg-blue-900/20 dark:border-blue-800">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
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
