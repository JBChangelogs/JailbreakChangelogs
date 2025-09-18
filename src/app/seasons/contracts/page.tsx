import React from "react";
import Link from "next/link";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import SeasonContractsClient from "@/components/Seasons/SeasonContractsClient";
import WeeklyContractsCountdown from "@/components/Seasons/WeeklyContractsCountdown";
import { fetchLatestSeason } from "@/utils/api";
import { fetchSeasonContracts } from "@/utils/api";

export const revalidate = 300; // Revalidate every 5 minutes

export default async function SeasonContractsPage() {
  const [contractsData, latestSeason] = await Promise.all([
    fetchSeasonContracts(),
    fetchLatestSeason(),
  ]);

  if (
    !contractsData ||
    !contractsData.data ||
    contractsData.data.length === 0
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#2E3944]">
        <div className="text-xl text-white">
          No contracts available right now.
        </div>
      </div>
    );
  }

  // If no season data, or season is over, do not show contracts
  const now = Math.floor(Date.now() / 1000);
  const seasonEnded = latestSeason?.end_date
    ? now >= latestSeason.end_date
    : false;

  return (
    <div className="min-h-screen bg-[#2E3944]">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb />

        <div className="mt-8">
          {/* Countdown Section */}
          {!seasonEnded && (
            <div className="mb-12">
              <WeeklyContractsCountdown season={latestSeason} />
            </div>
          )}
        </div>
        {!seasonEnded && (
          <SeasonContractsClient
            contracts={contractsData.data}
            updatedAt={contractsData.updated_at}
          />
        )}
        {seasonEnded && (
          <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
            <div className="flex items-start gap-4">
              <div className="mt-1 text-[#A8B3BC]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M4 21h16a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1Z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="mb-2 inline-flex items-center gap-2">
                  <span className="rounded bg-[#2E3944] px-2 py-1 text-[10px] font-semibold tracking-wider text-white/90 uppercase">
                    Season Ended
                  </span>
                </div>
                <h2 className="mb-1 text-xl font-bold text-white">
                  Season has ended
                </h2>
                <p className="mb-4 text-gray-300">
                  Weekly contracts are unavailable. Check back next season.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/seasons"
                    className="rounded bg-[#5865F2] px-4 py-2 text-white transition-colors hover:bg-[#4752C4]"
                  >
                    View Season Summary
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
