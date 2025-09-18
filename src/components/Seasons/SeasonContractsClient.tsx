"use client";

import React from "react";
import { formatMessageDate } from "@/utils/timestamp";
import localFont from "next/font/local";
import { RiCriminalFill } from "react-icons/ri";
import { GiPoliceOfficerHead } from "react-icons/gi";

const bangers = localFont({
  src: "../../../public/fonts/Bangers.ttf",
});

export interface SeasonContractProps {
  contracts: Array<{
    team: "Criminal" | "Police";
    name: string;
    description: string;
    reqseasonpass: boolean;
    goal: number;
    reward: number;
  }>;
  updatedAt?: number;
}

export default function SeasonContractsClient({
  contracts,
  updatedAt,
}: SeasonContractProps) {
  const formatUpdatedAt = React.useMemo(() => {
    if (!updatedAt) return null;
    return formatMessageDate(updatedAt);
  }, [updatedAt]);

  const grouped = React.useMemo(() => {
    const byTeam: Record<
      "Criminal" | "Police",
      SeasonContractProps["contracts"]
    > = {
      Criminal: [],
      Police: [],
    };
    contracts.forEach((c) => {
      if (c.team === "Criminal") byTeam.Criminal.push(c);
      else byTeam.Police.push(c);
    });
    return byTeam;
  }, [contracts]);

  return (
    <div className="space-y-12">
      {formatUpdatedAt && (
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-gray-800/50 px-4 py-2 text-sm text-gray-300 backdrop-blur-sm">
            Last updated: {formatUpdatedAt}
          </span>
        </div>
      )}

      {(["Criminal", "Police"] as const).map((team) => (
        <div key={team} className="space-y-6">
          {/* Team Header */}
          <div className="text-center">
            <div className="relative inline-block">
              <div
                className={`absolute inset-0 rounded-2xl opacity-30 blur-lg ${team === "Criminal" ? "bg-orange-500" : "bg-blue-500"}`}
              ></div>
              <div
                className={`relative rounded-2xl px-8 py-4 ${team === "Criminal" ? "bg-gradient-to-r from-orange-400 to-orange-500" : "bg-gradient-to-r from-blue-500 to-blue-600"} shadow-2xl`}
              >
                <div className="flex items-center justify-center gap-4">
                  {/* Team Icon */}
                  {team === "Criminal" ? (
                    <RiCriminalFill className="h-8 w-8 text-white" />
                  ) : (
                    <GiPoliceOfficerHead className="h-8 w-8 text-white" />
                  )}
                  <span className="text-2xl font-bold tracking-wide text-white uppercase">
                    {team} Contracts
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contracts Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {grouped[team].map((c, idx) => (
              <div
                key={`${team}-${c.name}-${idx}`}
                className="group hover:shadow-3xl relative flex flex-col overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105"
              >
                {/* Season Pass Corner Badge */}
                {c.reqseasonpass && (
                  <div className="absolute top-3 right-3 z-10">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-[#5865F2] opacity-50 blur-sm"></div>
                      <span className="relative rounded-full bg-[#5865F2] px-3 py-1 text-xs font-bold text-white shadow-lg">
                        Season Pass
                      </span>
                    </div>
                  </div>
                )}

                {/* Contract Header */}
                <div className="bg-black px-4 py-3">
                  <div
                    className={`text-2xl text-white uppercase ${bangers.className}`}
                  >
                    Contract {idx + 1}
                  </div>
                </div>

                {/* Contract Body */}
                <div
                  className={`relative flex flex-1 flex-col px-4 py-6 ${team === "Criminal" ? "bg-gradient-to-br from-orange-400 to-orange-500" : "bg-gradient-to-br from-blue-500 to-blue-600"}`}
                >
                  <div className="relative z-10 flex h-full flex-col">
                    {/* Task Description */}
                    <div className="mb-4 flex flex-1 items-center justify-center">
                      <div className="text-center text-xl leading-tight font-bold text-black">
                        {c.description}
                      </div>
                    </div>

                    {/* Special Note */}
                    {c.name === "AccumArrestBounty" && (
                      <div className="mb-4 rounded-xl border-2 border-yellow-600 bg-gradient-to-r from-yellow-100 to-yellow-200 px-3 py-2 text-xs text-yellow-800 shadow-lg">
                        <div className="flex items-center gap-2">
                          <svg
                            className="h-4 w-4 text-yellow-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="font-semibold">Note:</span> This goal
                          varies per player (e.g., 5,500–6,000). Displayed value
                          may be approximate.
                        </div>
                      </div>
                    )}

                    {/* Reward Section */}
                    <div className="mt-auto">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-xl bg-black opacity-50 blur-sm"></div>
                        <div className="relative rounded-xl bg-black px-4 py-3 shadow-lg">
                          <div
                            className={`text-2xl text-white uppercase ${bangers.className} text-center`}
                          >
                            REWARD: {c.reward} XP
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
