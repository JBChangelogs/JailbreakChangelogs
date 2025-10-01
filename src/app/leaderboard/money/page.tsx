import { fetchMoneyLeaderboard } from "@/utils/api";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import MoneyLeaderboardClient from "@/components/Leaderboard/MoneyLeaderboardClient";

// Cache this page for 5 minutes
export const revalidate = 300;

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
        </div>

        <MoneyLeaderboardClient initialLeaderboard={leaderboard} />
      </div>
    </main>
  );
}
