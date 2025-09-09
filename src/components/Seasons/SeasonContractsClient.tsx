"use client";

import React from "react";
import { formatMessageDate } from "@/utils/timestamp";

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
    <div className="space-y-6">
      {formatUpdatedAt && (
        <div className="text-sm text-gray-300">
          Last updated: {formatUpdatedAt}
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {(["Criminal", "Police"] as const).map((team) => (
          <div key={team}>
            <div className="mb-3 flex items-center gap-2">
              <span
                className={`rounded px-2 py-1 text-xs font-bold tracking-wide text-white uppercase ${team === "Criminal" ? "bg-orange-500" : "bg-blue-600"}`}
              >
                {team} Contracts
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {grouped[team].map((c, idx) => (
                <div
                  key={`${team}-${c.name}-${idx}`}
                  className={`overflow-hidden rounded-lg border bg-[#37424D] ${team === "Criminal" ? "border-l-4 border-[#2E3944] border-l-orange-500/80" : "border-l-4 border-[#2E3944] border-l-blue-600/80"}`}
                >
                  <div className="bg-[#212A31] px-4 py-2 text-sm font-bold text-white uppercase">
                    Contract {idx + 1}
                  </div>
                  <div className="p-4">
                    <div className="mb-3 text-lg leading-snug font-extrabold text-white">
                      {c.description}
                    </div>
                    {c.name === "AccumArrestBounty" && (
                      <div className="mb-3 rounded border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
                        Note: This goal varies per player (e.g., 5,500–6,000).
                        Displayed value may be approximate.
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="rounded bg-[#047857] px-3 py-2 text-sm font-bold text-white">
                        REWARD: {c.reward} XP
                      </div>
                      {c.reqseasonpass && (
                        <span className="rounded-full bg-[#5865F2] px-2 py-1 text-xs font-medium text-white">
                          Season Pass
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
