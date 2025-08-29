import { Suspense } from 'react';
import { fetchCrewLeaderboard } from '@/utils/api';
import CrewLeaderboard from '@/components/Crews/CrewLeaderboard';
import Breadcrumb from '@/components/Layout/Breadcrumb';

export const revalidate = 3600; // Revalidate every hour

export default async function CrewsPage() {
  const leaderboard = await fetchCrewLeaderboard();

  return (
    <div className="min-h-screen bg-[#2E3944] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Breadcrumb />
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-4xl font-bold text-gray-100">Crew Leaderboard</h1>
              <span className="text-[10px] uppercase font-semibold text-white bg-[#5865F2] px-1.5 py-0.5 rounded">New</span>
            </div>
            <p className="text-gray-400 text-lg">
              Top crews in Roblox Jailbreak based on their battle performance and rating.
            </p>
          </div>

          <Suspense fallback={<CrewLeaderboardSkeleton />}>
            <CrewLeaderboard leaderboard={leaderboard} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function CrewLeaderboardSkeleton() {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4 text-gray-300">Crew Leaderboard</h2>
      <div className="bg-[#212A31] rounded-lg p-4 shadow-sm border border-[#2E3944]">
        <div className="max-h-[48rem] overflow-y-auto space-y-3 pr-2">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-[#2E3944] border border-[#37424D] animate-pulse">
              <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="text-right">
                <div className="h-4 bg-gray-600 rounded w-16 mb-1"></div>
                <div className="h-3 bg-gray-700 rounded w-12"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
