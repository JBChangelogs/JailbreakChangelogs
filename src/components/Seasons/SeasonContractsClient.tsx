"use client";

import React from "react";
import { formatMessageDate } from "@/utils/helpers/timestamp";
import { Icon } from "../ui/IconWrapper";
import { bangers } from "@/app/fonts";

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
  const formatUpdatedAt = updatedAt ? formatMessageDate(updatedAt) : null;

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
          <span className="border-border-card bg-secondary-bg text-secondary-text inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm backdrop-blur-sm">
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
                className={`relative rounded-2xl border px-8 py-4 ${
                  team === "Criminal"
                    ? "border-orange-500/30 bg-orange-500/10"
                    : "border-blue-500/30 bg-blue-500/10"
                }`}
              >
                <div className="flex items-center justify-center gap-4">
                  {/* Team Icon */}
                  {team === "Criminal" ? (
                    <Icon
                      icon="ri:criminal-fill"
                      className="text-orange-500 h-8 w-8 shrink-0 sm:h-10 sm:w-10"
                      inline={true}
                    />
                  ) : (
                    <Icon
                      icon="game-icons:police-officer-head"
                      className="text-blue-500 h-8 w-8 shrink-0 sm:h-10 sm:w-10"
                      inline={true}
                    />
                  )}
                  <span
                    className={`text-2xl font-bold tracking-wide uppercase ${
                      team === "Criminal" ? "text-orange-500" : "text-blue-500"
                    }`}
                  >
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
                className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 ${
                  team === "Criminal"
                    ? "border-orange-500/30 bg-orange-500/5 hover:border-orange-500/60"
                    : "border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60"
                }`}
              >
                {/* Season Pass Corner Badge */}
                {c.reqseasonpass && (
                  <div className="absolute top-3 right-3 z-10">
                    <span
                      className={`inline-flex h-6 items-center rounded-lg border px-2.5 text-xs leading-none font-medium backdrop-blur-xl ${
                        team === "Criminal"
                          ? "border-orange-500/30 bg-orange-950/40 text-orange-200"
                          : "border-blue-500/30 bg-blue-950/40 text-blue-200"
                      }`}
                    >
                      Season Pass
                    </span>
                  </div>
                )}

                {/* Contract Header */}
                <div
                  className={`px-4 py-3 ${
                    team === "Criminal" ? "bg-orange-500/10" : "bg-blue-500/10"
                  }`}
                >
                  <div
                    className={`text-2xl uppercase ${bangers.className} ${
                      team === "Criminal" ? "text-orange-400" : "text-blue-400"
                    }`}
                  >
                    Contract {idx + 1}
                  </div>
                </div>

                {/* Contract Body */}
                <div className="relative flex flex-1 flex-col px-4 py-6">
                  <div className="relative z-10 flex h-full flex-col">
                    {/* Task Description */}
                    <div className="mb-4 flex flex-1 items-center justify-center">
                      <div className="text-primary-text text-center text-xl leading-tight font-bold">
                        {c.description}
                      </div>
                    </div>

                    {/* Special Note */}
                    {c.name === "AccumArrestBounty" && (
                      <div className="bg-button-info/10 border-button-info mb-4 rounded-lg border p-3">
                        <div className="text-primary-text flex items-center gap-2 text-sm">
                          <span className="font-medium">Note:</span>
                          <span>
                            This goal varies per player (e.g., 5,500–6,000).
                            Displayed value may be approximate.
                          </span>
                        </div>
                      </div>
                    )}
                    {/* Reward Section */}
                    <div className="mt-auto">
                      <div
                        className={`relative rounded-xl border px-4 py-3 transition-colors ${
                          team === "Criminal"
                            ? "border-orange-500/40 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                            : "border-blue-500/40 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                        }`}
                      >
                        <div
                          className={`text-2xl uppercase ${bangers.className} text-center ${
                            team === "Criminal"
                              ? "text-orange-600 dark:text-orange-400"
                              : "text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          REWARD: {c.reward} XP
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
