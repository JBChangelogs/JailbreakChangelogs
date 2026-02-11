"use client";

import React from "react";
import { formatMessageDate } from "@/utils/timestamp";
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
              <div className="border-border-card bg-secondary-bg relative rounded-2xl border px-8 py-4">
                <div className="flex items-center justify-center gap-4">
                  {/* Team Icon */}
                  {team === "Criminal" ? (
                    <Icon
                      icon="ri:criminal-fill"
                      className="text-primary-text h-8 w-8 shrink-0 sm:h-10 sm:w-10"
                      inline={true}
                    />
                  ) : (
                    <Icon
                      icon="game-icons:police-officer-head"
                      className="text-primary-text h-8 w-8 shrink-0 sm:h-10 sm:w-10"
                      inline={true}
                    />
                  )}
                  <span className="text-primary-text text-2xl font-bold tracking-wide uppercase">
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
                className="group border-border-card relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300"
              >
                {/* Season Pass Corner Badge */}
                {c.reqseasonpass && (
                  <div className="absolute top-3 right-3 z-10">
                    <div className="relative">
                      <span className="bg-tertiary-bg text-primary-text relative rounded-full px-3 py-1 text-xs font-bold">
                        Season Pass
                      </span>
                    </div>
                  </div>
                )}

                {/* Contract Header */}
                <div className="bg-secondary-bg px-4 py-3">
                  <div
                    className={`text-primary-text text-2xl uppercase ${bangers.className}`}
                  >
                    Contract {idx + 1}
                  </div>
                </div>

                {/* Contract Body */}
                <div className="bg-secondary-bg relative flex flex-1 flex-col px-4 py-6">
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
                      <div className="relative">
                        <div className="bg-primary-bg absolute inset-0 rounded-xl opacity-50 blur-sm"></div>
                        <div className="border-border-card bg-tertiary-bg relative rounded-xl border px-4 py-3">
                          <div
                            className={`text-primary-text text-2xl uppercase ${bangers.className} text-center`}
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
