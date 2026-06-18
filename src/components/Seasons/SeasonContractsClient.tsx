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

type ContractWikiNote = {
  match: (desc: string, name: string) => boolean;
  note: string;
};

const CONTRACT_WIKI_NOTES: ContractWikiNote[] = [
  // ── Police ──────────────────────────────────────────────────────────────
  {
    match: (d, n) =>
      n === "AccumArrestBounty" ||
      (d.includes("arrest") && d.includes("worth") && d.includes("bounty")),
    note: "Goal varies per player (e.g., 5,500–6,000). Displayed value may be approximate.",
  },
  {
    match: (d) =>
      d.includes("arrest") &&
      d.includes("criminals") &&
      !d.includes("worth") &&
      !d.includes("with a"),
    note: "The variable goal can be between 12–17 criminals.",
  },
  {
    match: (d) => d.includes("pit maneuver"),
    note: "The variable goal can be between 5–7 criminals.",
  },
  {
    match: (d) => d.includes("taze"),
    note: "The variable goal can be between 4–6 criminals.",
  },
  {
    match: (d) => d.includes("arrest a criminal with"),
    note: "The bounty threshold can be $2,500 or $3,000.",
  },
  // ── Criminal ────────────────────────────────────────────────────────────
  {
    match: (d) =>
      d.includes("rob the bank") ||
      (d.includes("rob") && d.includes("bank") && d.includes("times")),
    note: "The variable goal can be 3 or 4 bank robberies.",
  },
  {
    match: (d) => d.includes("power plant"),
    note: "The criminal must not die. If they die, the contract resets and a 15-second penalty is added.",
  },
  {
    match: (d) => d.includes("rob") && d.includes("train"),
    note: "Works for both trains despite the grammar mistake implying it's only the Cargo Train.",
  },
  {
    match: (d) =>
      d.includes("take down") && d.includes("police") && d.includes("dying"),
    note: "The variable goal can be between 4–6 police. If the player dies as a criminal, the contract resets with a 15-second penalty. Police kills on criminals and prisoners also count. Melee kills (Sword or Baton) don't count.",
  },
  {
    match: (d) => d.includes("knock over"),
    note: "The variable goal can be between 400–410 items.",
  },
  {
    match: (d) => d.includes("deal") && d.includes("damage"),
    note: "The variable goal can be between 1,800–2,200 damage.",
  },
  {
    match: (d) => d.includes("small stores"),
    note: "Must rob both the Donut Store and Gas Station without dying. Can rob the same store twice. If the criminal dies, the contract resets with a 15-second penalty.",
  },
  {
    match: (d) => d.includes("collect a bounty"),
    note: "The criminal must not die. If they die, the contract resets and a 15-second penalty is added.",
  },
];

function getContractNote(description: string, name: string): string | null {
  const d = description.toLowerCase();
  return CONTRACT_WIKI_NOTES.find((n) => n.match(d, name))?.note ?? null;
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
      {(["Criminal", "Police"] as const).map((team) => (
        <div key={team} className="space-y-6">
          {/* Team Header */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="border-border-card bg-secondary-bg relative rounded-2xl border px-8 py-4">
                <div className="flex items-center justify-center gap-4">
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
            {grouped[team].map((c, idx) => {
              const wikiNote = getContractNote(c.description, c.name);
              return (
                <div
                  key={`${team}-${c.name}-${idx}`}
                  className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 ${
                    c.reqseasonpass
                      ? "border-supporter-gold-border/50"
                      : "border-border-card"
                  }`}
                  style={
                    c.reqseasonpass
                      ? {
                          boxShadow:
                            "0 0 18px color-mix(in srgb, var(--color-supporter-gold-border) 12%, transparent)",
                        }
                      : undefined
                  }
                >
                  {/* Contract Header */}
                  <div
                    className={`flex items-center justify-between px-4 py-3 ${
                      c.reqseasonpass
                        ? "bg-supporter-gold-bg"
                        : "bg-secondary-bg"
                    }`}
                  >
                    <div
                      className={`text-2xl uppercase ${bangers.className} ${
                        c.reqseasonpass
                          ? "text-warning-dark"
                          : "text-primary-text"
                      }`}
                    >
                      Contract {idx + 1}
                    </div>
                    {c.reqseasonpass && (
                      <span className="border-supporter-gold-border/40 bg-supporter-gold-bg text-warning-dark inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold">
                        <Icon
                          icon="mdi:crown"
                          className="h-3.5 w-3.5"
                          inline={true}
                        />
                        Season Pass
                      </span>
                    )}
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

                      {/* Wiki Note */}
                      {wikiNote && (
                        <div className="bg-button-info/10 border-button-info mb-4 rounded-lg border p-3">
                          <div className="text-primary-text text-center text-sm">
                            {wikiNote}
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
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <p className="text-secondary-text text-xs">
          Contract notes sourced from the{" "}
          <a
            href="https://jailbreak.fandom.com/wiki/Contracts"
            target="_blank"
            rel="noopener noreferrer"
            className="text-link hover:text-link-hover underline underline-offset-2 transition-colors"
          >
            Jailbreak Wiki
          </a>
        </p>
        {formatUpdatedAt && (
          <p className="text-secondary-text text-sm">
            <span className="font-semibold">Last Updated:</span>{" "}
            {formatUpdatedAt}
          </p>
        )}
      </div>
    </div>
  );
}
